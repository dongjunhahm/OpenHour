// Script to initialize the Render PostgreSQL database with multiple fallback options
import pkg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import tls from 'tls';

const { Pool } = pkg;
dotenv.config({ path: '.env.local' });

// Function to get the certificate info during the connection
function getServerCertificate(host, port) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host,
        port,
        rejectUnauthorized: false, // Allow connection to get cert info
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        socket.end();
        resolve(cert);
      }
    );
    socket.on('error', (err) => {
      reject(err);
    });
  });
}

async function initializeRenderDatabase() {
  try {
    // Get connection string from Render environment
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    
    if (!connectionString) {
      console.error('No PostgreSQL connection string found in environment');
      process.exit(1);
    }
    
    console.log('Attempting to connect to database with multiple methods');
    
    // Extract host from connection string to use in certificate check
    const match = connectionString.match(/host=([^&\s]+)/);
    const host = match ? match[1] : (process.env.POSTGRES_HOST || 'localhost');
    const port = parseInt(process.env.POSTGRES_PORT || '5432');
    
    // Try different connection methods in sequence
    let client;
    let pool;
    
    // Method 1: Try system's trusted certificates
    try {
      console.log('Attempt 1: Connecting with system trusted certificates');
      pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: true
        }
      });
      client = await pool.connect();
      console.log('Connected successfully using system trusted certificates');
    } catch (err1) {
      console.log('System trusted certificates failed:', err1.message);
      
      // Method 2: Try disabling certificate validation
      try {
        console.log('Attempt 2: Connecting with certificate validation disabled');
        // Close previous pool if exists
        if (pool) await pool.end();
        
        pool = new Pool({
          connectionString,
          ssl: {
            rejectUnauthorized: false
          }
        });
        client = await pool.connect();
        console.log('Connected successfully with certificate validation disabled');
      } catch (err2) {
        console.log('Disabled certificate validation failed:', err2.message);
        
        // Method 3: Try direct connection without SSL
        try {
          console.log('Attempt 3: Connecting without SSL');
          // Close previous pool if exists
          if (pool) await pool.end();
          
          // Parse connection string to get individual parameters
          const connectionMatches = {
            user: connectionString.match(/user=([^&\s]+)/),
            password: connectionString.match(/password=([^&\s]+)/),
            host: connectionString.match(/host=([^&\s]+)/),
            port: connectionString.match(/port=([^&\s]+)/),
            database: connectionString.match(/database=([^&\s]+)/) || connectionString.match(/dbname=([^&\s]+)/)
          };
          
          pool = new Pool({
            user: connectionMatches.user ? connectionMatches.user[1] : process.env.POSTGRES_USER,
            password: connectionMatches.password ? connectionMatches.password[1] : process.env.POSTGRES_PASSWORD,
            host: connectionMatches.host ? connectionMatches.host[1] : process.env.POSTGRES_HOST,
            port: connectionMatches.port ? parseInt(connectionMatches.port[1]) : parseInt(process.env.POSTGRES_PORT || '5432'),
            database: connectionMatches.database ? connectionMatches.database[1] : process.env.POSTGRES_DATABASE,
            ssl: false
          });
          client = await pool.connect();
          console.log('Connected successfully without SSL');
        } catch (err3) {
          console.error('All connection methods failed');
          throw new Error(`Multiple connection attempts failed: ${err1.message}, ${err2.message}, ${err3.message}`);
        }
      }
    }
    
    // Continue with database initialization
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
    
    // Release client and close pool
    client.release();
    await pool.end();
    
    // Success!
    console.log('Database initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization function
initializeRenderDatabase();
