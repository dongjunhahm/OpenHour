import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Determine which database connection to use
const connectionString = process.env.POSTGRES_URL || 
                        process.env.POSTGRES_URL_NON_POOLING || 
                        `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}?sslmode=require`;

console.log('Using connection string:', connectionString ? 'Connection string available' : 'No connection string');

// Create a connection pool for Supabase
const Pool = pg.Pool;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// Read the schema SQL file
const schemaSql = fs.readFileSync('./schema.sql', 'utf8');

async function setupDatabase() {
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database on Supabase');
    
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
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
