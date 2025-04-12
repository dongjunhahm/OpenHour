// Script to initialize the Render PostgreSQL database
import pkg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import https from 'https';

const { Pool } = pkg;
dotenv.config({ path: '.env.local' });

async function initializeRenderDatabase() {
  // Get connection string from Render environment or use explicit parameters
  let connectionConfig = {};
  
  if (process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING) {
    // Use connection string if available
    connectionConfig.connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  } else {
    // Use individual parameters if no connection string
    connectionConfig = {
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      host: process.env.POSTGRES_HOST,
      port: 5432, // Default PostgreSQL port
    };
  }
  
  console.log('Initializing database with connection configuration');
  
  // Create our own agent with relaxed SSL requirements
  const sslOptions = {
    rejectUnauthorized: false // This allows self-signed certificates
  };
  
  // Add SSL configuration to connection
  connectionConfig.ssl = sslOptions;
  
  // Create a connection pool
  const pool = new Pool(connectionConfig);

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
