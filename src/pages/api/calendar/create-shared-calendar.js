import axios from "axios";
import { pool } from "../db";

// Log database connection status on startup
console.log('Database connection environment:', {
  isVercel: !!process.env.VERCEL,
  hasPostgresUrl: !!process.env.POSTGRES_URL,
  hasNonPoolingUrl: !!process.env.POSTGRES_URL_NON_POOLING,
  env: process.env.NODE_ENV
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, startDate, endDate, minDuration } = req.body;
  console.log("Received request with params:", { token, startDate, endDate, minDuration });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // First check if the users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      throw new Error("Database tables not initialized. Please run the database setup first.");
    }

    // Continue with the original query
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [token]
    );
    
    // If user doesn't exist, create a new user
    let userId;
    if (userResult.rows.length === 0) {
      const newUserResult = await client.query(
        "INSERT INTO users (google_token, created_at) VALUES ($1, NOW()) RETURNING id",
        [token]
      );
      userId = newUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Convert the time format "1:00:00" to minutes (60)
    const minDurationMinutes = parseFloat(minDuration.split(":")[0]) * 60;
    
    // Insert into calendars table according to the schema
    const calendarResult = await client.query(
      `INSERT INTO calendars(
        title, 
        description, 
        min_slot_duration, 
        start_date, 
        end_date, 
        owner_id, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id, invite_code`,
      [
        'Shared Calendar', // title
        'Calendar created with OpenHour', // description
        minDurationMinutes, // min_slot_duration in minutes
        new Date(startDate),
        new Date(endDate),
        userId
      ]
    );
    
    const calendarId = calendarResult.rows[0].id;

    // Insert the user as a participant with owner status
    await client.query(
      `INSERT INTO calendar_participants (calendar_id, user_id, is_owner, joined_at)
       VALUES ($1, $2, true, NOW())`,
      [calendarId, userId]
    );

    await client.query("COMMIT");

    // Return successful response with the necessary data
    res.status(201).json({
      calendarId: calendarId,
      inviteCode: calendarResult.rows[0].invite_code,
      message: "Calendar created successfully"
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError.message);
    }
    
    // Detailed error logging
    console.error("Calendar creation error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      query: error.query,
      detail: error.detail,
      isConnectionError: error.message.includes('ECONNREFUSED')
    });
    
    // Return more helpful error message based on error type
    if (error.message.includes('ECONNREFUSED')) {
      res.status(500).json({
        message: "Database connection failed. Check Vercel environment variables.",
        error: error.message,
        suggestion: "Verify that POSTGRES_URL or related environment variables are set correctly in Vercel."
      });
    } else if (error.code === '42P01') { // Relation does not exist
      res.status(500).json({
        message: "Database tables not created yet.",
        error: error.message,
        suggestion: "Database schema needs to be initialized."
      });
    } else {
      res.status(500).json({
        message: "Failed to create calendar",
        error: error.message,
      });
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
