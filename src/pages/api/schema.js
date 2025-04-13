import { pool } from './db';

// Function to set up the database schema
export async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255),
        google_token TEXT,
        email VARCHAR(255),
        name VARCHAR(255),
        profile_picture TEXT,
        created_at TIMESTAMP NOT NULL,
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
        created_at TIMESTAMP NOT NULL,
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
        status VARCHAR(20) DEFAULT 'pending',
        joined_at TIMESTAMP NOT NULL,
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
        created_at TIMESTAMP NOT NULL
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
        created_at TIMESTAMP NOT NULL,
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
        created_at TIMESTAMP NOT NULL
      )
    `);
    
    await client.query('COMMIT');
    console.log('Database schema setup complete');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

// API route handler to set up the database
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    await setupDatabase();
    return res.status(200).json({ message: 'Database schema setup complete' });
  } catch (error) {
    return res.status(500).json({ message: 'Error setting up database schema', error: error.message });
  }
}
