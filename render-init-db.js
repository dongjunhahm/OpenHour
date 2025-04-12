/**
 * Render Database Initialization Script
 * 
 * This script directly initializes the database schema using pg queries
 * without relying on Prisma, which seems not to be fully set up in this project.
 */

console.log('Starting database initialization with direct SQL...');

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("Creating users table...");
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

    console.log("Creating calendars table...");
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

    console.log("Creating calendar_participants table...");
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

    console.log("Creating events table...");
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

    console.log("Creating invitations table...");
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

    console.log("Creating available_slots table...");
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

    console.log("Creating indexes...");
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
    pool.end();
  }
}

// Run the initialization with retries
(async function initDbWithRetry(maxRetries = 5, delay = 5000) {
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
