import { pool } from "./db";

// Function to set up the database schema
export async function setupDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255),
        google_token TEXT,
        email VARCHAR(255),
        name VARCHAR(255),
        profile_picture TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // Create calendars table with invite code
    await client.query(`
      CREATE TABLE IF NOT EXISTS calendars (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        min_slot_duration INTEGER NOT NULL, -- in minutes
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        invite_code UUID DEFAULT gen_random_uuid(),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Create calendar participants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS calendar_participants (
        id SERIAL PRIMARY KEY,
        calendar_id INTEGER REFERENCES calendars(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_owner BOOLEAN DEFAULT false,
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (calendar_id, user_id)
      )
    `);

    // Create events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        calendar_id INTEGER REFERENCES calendars(id) ON DELETE CASCADE,
        google_event_id VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invitations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        calendar_id INTEGER REFERENCES calendars(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recipient_email VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP
      )
    `);

    // Create available slots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS available_slots (
        id SERIAL PRIMARY KEY,
        calendar_id INTEGER REFERENCES calendars(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_google_token ON users(google_token);
      CREATE INDEX IF NOT EXISTS idx_calendar_participants_user_id ON calendar_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_participants_calendar_id ON calendar_participants(calendar_id);
    `);

    await client.query("COMMIT");
    console.log("Database schema setup complete");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error setting up database schema:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Initialize the database immediately when this module is imported
// Use an IIFE with retry mechanism for database initialization
(async function initDbWithRetry(maxRetries = 3, delay = 3000) {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      console.log(`Attempt ${attempts + 1} to initialize database schema...`);
      await setupDatabase();
      console.log(`Database schema successfully initialized on attempt ${attempts + 1}`);
      return;
    } catch (error) {
      attempts++;
      console.error(`Failed to initialize database schema (attempt ${attempts}/${maxRetries}):`, error);
      
      if (attempts >= maxRetries) {
        console.error(`Max retries (${maxRetries}) reached. Database initialization failed.`);
        break;
      }
      
      console.log(`Waiting ${delay}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
})().catch(error => {
  console.error("Unhandled error in database initialization:", error);
});

// API route handler to manually set up the database
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await setupDatabase();
    return res.status(200).json({ message: "Database schema setup complete" });
  } catch (error) {
    return res.status(500).json({
      message: "Error setting up database schema",
      error: error.message,
    });
  }
}
