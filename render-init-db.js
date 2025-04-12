// Script to initialize the Render PostgreSQL database
import pkg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config({ path: '.env.local' });

async function initializeRenderDatabase() {
  // Get connection string from Render environment
  const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  
  if (!connectionString) {
    console.error('No PostgreSQL connection string found in environment');
    process.exit(1);
  }
  
  console.log('Initializing database with connection string:', connectionString ? 'Found connection string' : 'No connection string');
  
  // Create a connection pool
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  let client;
  
  try {
    // Connect to database
    client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    
    // Read schema SQL file
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    console.log('Read schema.sql file successfully');
    
    // Execute schema
    console.log('Creating tables...');
    await client.query(schema);
    console.log('Database schema created successfully');
    
    // Verify tables were created
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables created:', tableCheck.rows.map(row => row.table_name).join(', '));
    
    // Success!
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    if (client) client.release();
    
    // Close the pool
    await pool.end();
  }
}

// Run the initialization function
initializeRenderDatabase();
