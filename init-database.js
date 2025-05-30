import pg from 'pg';
import dotenv from 'dotenv';
import { createInterface } from 'readline';
import fs from 'fs';
import path from 'path';

// Load environment variables
try {
  // First try to load from .env.local for development
  dotenv.config({ path: '.env.local' });
  // Then try to load from .env as fallback
  dotenv.config();
  
  console.log('Environment loaded. DATABASE_URL exists:', !!process.env.DATABASE_URL);
} catch (error) {
  console.warn('Error loading dotenv:', error.message);
}

// Create a connection pool
const Pool = pg.Pool;

// Determine if we're in production (Render) or development (local)
const isProduction = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

// Configure the pool based on environment
let poolConfig;
if (isProduction && process.env.DATABASE_URL) {
  console.log('Using Render production database');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Render PostgreSQL
    }
  };
} else {
  console.log('Using local development database');
  poolConfig = {
    user: process.env.DB_USER || 'openhour_admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'openhour_database',
    password: process.env.DB_PASSWORD || 'Openhour1@2',
    port: process.env.DB_PORT || 5432
  };
}

// Create the connection pool with the appropriate configuration
const pool = new Pool(poolConfig);

// Test the database connection before proceeding
async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    console.log('Successfully connected to database! Server time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    console.error('Connection config (sanitized):', {
      ...poolConfig,
      password: '********', // Hide actual password
      connectionString: poolConfig.connectionString ? '********' : undefined // Hide connection string
    });
    return false;
  } finally {
    client.release();
  }
}

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Checking if database exists...');
    
    // Create users table
    console.log('Creating users table...');
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
    console.log('Creating calendars table...');
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
    console.log('Creating calendar_participants table...');
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
    console.log('Creating events table...');
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
    console.log('Creating invitations table...');
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
    console.log('Creating available_slots table...');
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
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_google_token ON users(google_token);
      CREATE INDEX IF NOT EXISTS idx_calendar_participants_user_id ON calendar_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_participants_calendar_id ON calendar_participants(calendar_id);
    `);
    
    await client.query('COMMIT');
    console.log('Database schema setup complete');
    
    // Insert test data function
    const insertTestData = async () => {
      try {
        await client.query('BEGIN');
        
        console.log('Inserting test user...');
        const userResult = await client.query(`
          INSERT INTO users (google_token, email, name, created_at)
          VALUES ('test-token', 'test@example.com', 'Test User', NOW())
          RETURNING id
        `);
        
        const userId = userResult.rows[0].id;
        
        console.log(`Test user created with ID: ${userId}`);
        
        await client.query('COMMIT');
        console.log('Test data inserted successfully');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error inserting test data:', error);
      } finally {
        await pool.end();
        process.exit(0);
      }
    };
    
    // Handle differently for production vs development
    if (isProduction) {
      console.log('Running in production mode - skipping test data');
      await pool.end();
      process.exit(0);
    } else {
      // Ask about inserting test data in development mode
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Would you like to insert test data? [y/n] ', async (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y') {
          await insertTestData();
        } else {
          await pool.end();
          process.exit(0);
        }
      });
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up database schema:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the initialization with connection test
async function run() {
  try {
    const connectionSuccessful = await testConnection();
    if (connectionSuccessful) {
      await initializeDatabase();
    } else {
      console.error('Aborting database initialization due to connection failure');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error during initialization:', error);
    process.exit(1);
  }
}

run();
