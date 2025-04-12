import { pool as localPool } from './db';
import { pool as supabasePool, testSupabaseConnection } from './supabaseDb';

// Function to migrate schema from local to Supabase
export async function migrateSchema() {
  console.log('Starting database migration to Supabase...');
  
  // Test Supabase connection first
  const connectionTest = await testSupabaseConnection();
  if (!connectionTest.success) {
    throw new Error(`Failed to connect to Supabase: ${connectionTest.error}`);
  }
  console.log('Successfully connected to Supabase');
  
  const supabaseClient = await supabasePool.connect();
  
  try {
    await supabaseClient.query("BEGIN");

    // Create users table
    await supabaseClient.query(`
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
    await supabaseClient.query(`
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
    await supabaseClient.query(`
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
    await supabaseClient.query(`
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
    await supabaseClient.query(`
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
    await supabaseClient.query(`
      CREATE TABLE IF NOT EXISTS available_slots (
        id SERIAL PRIMARY KEY,
        calendar_id INTEGER REFERENCES calendars(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await supabaseClient.query(`
      CREATE INDEX IF NOT EXISTS idx_users_google_token ON users(google_token);
      CREATE INDEX IF NOT EXISTS idx_calendar_participants_user_id ON calendar_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_participants_calendar_id ON calendar_participants(calendar_id);
    `);

    await supabaseClient.query("COMMIT");
    console.log("Supabase schema setup complete");
    return true;
  } catch (error) {
    await supabaseClient.query("ROLLBACK");
    console.error("Error setting up Supabase schema:", error);
    throw error;
  } finally {
    supabaseClient.release();
  }
}

// Function to migrate data from local to Supabase
export async function migrateData() {
  console.log('Starting data migration to Supabase...');
  
  const localClient = await localPool.connect();
  const supabaseClient = await supabasePool.connect();
  
  try {
    // 1. Migrate users
    const users = await localClient.query('SELECT * FROM users');
    if (users.rows.length > 0) {
      console.log(`Migrating ${users.rows.length} users...`);
      
      for (const user of users.rows) {
        await supabaseClient.query(`
          INSERT INTO users (id, google_id, google_token, email, name, profile_picture, created_at, last_login)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [
          user.id, 
          user.google_id,
          user.google_token,
          user.email,
          user.name,
          user.profile_picture,
          user.created_at,
          user.last_login
        ]);
      }
    }

    // 2. Migrate calendars
    const calendars = await localClient.query('SELECT * FROM calendars');
    if (calendars.rows.length > 0) {
      console.log(`Migrating ${calendars.rows.length} calendars...`);
      
      for (const calendar of calendars.rows) {
        await supabaseClient.query(`
          INSERT INTO calendars (id, title, description, min_slot_duration, start_date, end_date, owner_id, invite_code, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, [
          calendar.id, 
          calendar.title,
          calendar.description,
          calendar.min_slot_duration,
          calendar.start_date,
          calendar.end_date,
          calendar.owner_id,
          calendar.invite_code,
          calendar.created_at,
          calendar.updated_at
        ]);
      }
    }

    // 3. Migrate calendar participants
    const participants = await localClient.query('SELECT * FROM calendar_participants');
    if (participants.rows.length > 0) {
      console.log(`Migrating ${participants.rows.length} calendar participants...`);
      
      for (const participant of participants.rows) {
        await supabaseClient.query(`
          INSERT INTO calendar_participants (id, calendar_id, user_id, is_owner, joined_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (calendar_id, user_id) DO NOTHING
        `, [
          participant.id, 
          participant.calendar_id,
          participant.user_id,
          participant.is_owner,
          participant.joined_at
        ]);
      }
    }

    // 4. Migrate events
    const events = await localClient.query('SELECT * FROM events');
    if (events.rows.length > 0) {
      console.log(`Migrating ${events.rows.length} events...`);
      
      for (const event of events.rows) {
        await supabaseClient.query(`
          INSERT INTO events (id, user_id, calendar_id, google_event_id, title, description, start_time, end_time, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, [
          event.id, 
          event.user_id,
          event.calendar_id,
          event.google_event_id,
          event.title,
          event.description,
          event.start_time,
          event.end_time,
          event.created_at
        ]);
      }
    }

    // 5. Migrate invitations
    const invitations = await localClient.query('SELECT * FROM invitations');
    if (invitations.rows.length > 0) {
      console.log(`Migrating ${invitations.rows.length} invitations...`);
      
      for (const invitation of invitations.rows) {
        await supabaseClient.query(`
          INSERT INTO invitations (id, calendar_id, sender_id, recipient_email, status, created_at, responded_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [
          invitation.id, 
          invitation.calendar_id,
          invitation.sender_id,
          invitation.recipient_email,
          invitation.status,
          invitation.created_at,
          invitation.responded_at
        ]);
      }
    }

    // 6. Migrate available slots
    const slots = await localClient.query('SELECT * FROM available_slots');
    if (slots.rows.length > 0) {
      console.log(`Migrating ${slots.rows.length} available slots...`);
      
      for (const slot of slots.rows) {
        await supabaseClient.query(`
          INSERT INTO available_slots (id, calendar_id, start_time, end_time, created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
        `, [
          slot.id, 
          slot.calendar_id,
          slot.start_time,
          slot.end_time,
          slot.created_at
        ]);
      }
    }

    console.log('Data migration complete');
    return true;
  } catch (error) {
    console.error('Error migrating data:', error);
    throw error;
  } finally {
    localClient.release();
    supabaseClient.release();
  }
}

// API handler for migration
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // First set up the schema
    await migrateSchema();
    
    // Then migrate the data if requested
    if (req.body.migrateData === true) {
      await migrateData();
      return res.status(200).json({ 
        message: 'Database schema and data migration complete' 
      });
    } else {
      return res.status(200).json({ 
        message: 'Database schema migration complete. Data migration skipped.' 
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Error during migration',
      error: error.message,
    });
  }
}
