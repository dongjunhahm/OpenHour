import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;

// Create a pool with the same config as your application
const poolConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING,
  ssl: {
    rejectUnauthorized: false,
  },
};

export async function GET() {
  // Get the current version from package.json if possible
  let version = 'unknown';
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      version = packageJson.version;
    }
  } catch (error) {
    console.error('Error reading package.json:', error);
  }

  // Check database connection
  let dbStatus = 'unknown';
  let dbMessage = '';
  let dbDetails = {};

  try {
    const pool = new Pool(poolConfig);
    const client = await pool.connect();
    
    try {
      // Check if users table exists
      const tableCheckResult = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
      );
      
      const usersTableExists = tableCheckResult.rows[0].exists;
      
      if (usersTableExists) {
        // Count users to verify table is operational
        const userCountResult = await client.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(userCountResult.rows[0].count);
        
        dbStatus = 'healthy';
        dbMessage = 'Database connection successful';
        dbDetails = {
          usersTableExists,
          userCount,
          timestamp: new Date().toISOString()
        };
      } else {
        dbStatus = 'warning';
        dbMessage = 'Database connected but users table does not exist';
        dbDetails = {
          usersTableExists,
          timestamp: new Date().toISOString()
        };
      }
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    dbStatus = 'error';
    dbMessage = `Database connection failed: ${error.message}`;
    console.error('Health check - Database error:', error);
  }

  // Return a 200 OK response with all status info
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version,
    database: {
      status: dbStatus,
      message: dbMessage,
      ...dbDetails
    }
  });
}
