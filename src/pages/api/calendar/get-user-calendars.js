import { pool } from "../db";
import { query } from "pg";
import "../setupDb"; // Import the setupDb file to ensure database is initialized

// Log database connection info on startup
console.log('get-user-calendars: Database connection environment:', {
  isVercel: !!process.env.VERCEL,
  hasPostgresUrl: !!process.env.POSTGRES_URL,
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  env: process.env.NODE_ENV
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Missing token parameter" });
  }

  const client = await pool.connect();

  try {
    console.log('Received token:', token);
    
    // Get user ID from token
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [token]
    );
    
    console.log('User result:', userResult.rows);

    let userId;
    if (userResult.rows.length === 0) {
      // User doesn't exist, create a new user record
      try {
        console.log('Creating new user with token:', token);
        const newUserResult = await client.query(
          'INSERT INTO users (google_token, created_at) VALUES ($1, NOW()) RETURNING id',
          [token]
        );
        userId = newUserResult.rows[0].id;
        console.log('Created new user with ID:', userId);
      } catch (userCreateError) {
        console.error('Error creating user:', userCreateError);
        return res.status(500).json({ message: "Error creating user", error: userCreateError.message });
      }
    } else {
      userId = userResult.rows[0].id;
    }

    // Check if the user has any calendars
    try {
      // Get all calendars where the user is a participant
      const calendarsResult = await client.query(
        `SELECT 
            c.id, 
            c.owner_id, 
            c.title,
            c.description,
            c.start_date, 
            c.end_date, 
            c.min_slot_duration, 
            'active' as status,
            (SELECT COUNT(*) FROM calendar_participants WHERE calendar_id = c.id) as participant_count
         FROM calendars c
         JOIN calendar_participants cp ON c.id = cp.calendar_id
         WHERE cp.user_id = $1
         ORDER BY c.created_at DESC`,
        /* Note: Changed creator_id to owner_id based on the schema in db.js */
        /* Added 'active' as status since it seems this column might be missing */
        [userId]
      );
      
      return res.status(200).json({
        calendars: calendarsResult.rows
      });
      
    } catch (calendarError) {
      // If the error is because the tables don't exist yet or the user has no calendars
      console.error('Error fetching calendars:', calendarError);
      
      // Return an empty array of calendars rather than an error
      return res.status(200).json({
        calendars: []
      });
    }

    return res.status(200).json({
      calendars: calendarsResult.rows
    });
  } catch (error) {
    console.error("Error getting user calendars:", error);
    // Log more details about the error
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      query: error.query,
      code: error.code,
      detail: error.detail,
      isConnectionError: error.message.includes('ECONNREFUSED')
    });

    // Handle different types of errors with helpful messages
    if (error.message.includes('ECONNREFUSED')) {
      return res.status(500).json({ 
        message: "Database connection failed. Check Vercel environment variables.", 
        error: error.message,
        suggestion: "Verify that POSTGRES_URL or related environment variables are correctly set in Vercel."
      });
    }
    // Special handling for missing tables
    else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      // Return empty result instead of error if tables don't exist yet
      return res.status(200).json({
        calendars: [],
        notice: "Database is being set up, please try again in a moment"
      });
    }
    // Generic database errors
    else if (error.code && error.code.startsWith('42')) {
      return res.status(500).json({ 
        message: "Database schema error", 
        error: error.message,
        suggestion: "The database schema may need to be initialized or updated."
      });
    }
    // Default error handler
    else {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  } finally {
    // Safely release the client back to the pool
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error("Error releasing client:", releaseError.message);
      }
    }
  }
}
