import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create a connection pool
const Pool = pg.Pool;
const pool = new Pool({
  user: process.env.DB_USER || 'openhour_admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'openhour_database',
  password: process.env.DB_PASSWORD || 'Openhour1@2',
  port: process.env.DB_PORT || 5432,
});

// Read the schema SQL file
const schemaSql = fs.readFileSync('./schema.sql', 'utf8');

async function setupDatabase() {
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    
    // Execute the schema SQL
    console.log('Creating tables...');
    await client.query(schemaSql);
    console.log('Database schema created successfully');
    
    // Release the client back to the pool
    client.release();
    console.log('Database setup complete!');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
