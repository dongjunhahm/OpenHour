import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Pool } = pg;

// Supabase direct PostgreSQL connection
export const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false // Required for Vercel-hosted Postgres
  }
});

// Alternative connection using connection string if the above doesn't work
export const poolUrl = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Supabase client for auth and storage features
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

// Supabase admin client for operations requiring higher privileges
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

// Test the connection
export async function testSupabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return { success: true, timestamp: result.rows[0].now };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { success: false, error: error.message };
  }
}

// Handler for API routes
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await testSupabaseConnection();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error connecting to Supabase', 
      error: error.message 
    });
  }
}
