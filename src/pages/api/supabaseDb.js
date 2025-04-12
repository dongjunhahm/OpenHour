import { createClient } from '@supabase/supabase-js';

// Create Supabase clients WITHOUT using direct PostgreSQL connections
// This avoids all SSL certificate issues by using Supabase's REST API instead

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Standard client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Admin client with service role key (for server-side operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * This function emulates the pg Pool interface 
 * but uses Supabase internally to avoid SSL issues
 */
class SupabasePoolEmulator {
  async connect() {
    // Return a client object that emulates the pg Client interface
    return {
      query: async (text, params = []) => {
        return this.query(text, params);
      },
      release: () => {
        // Nothing to do here as we're not actually maintaining a connection
      }
    };
  }

  async query(text, params = []) {
    try {
      // Use Supabase's REST API instead of direct PostgreSQL connection
      const { data, error } = await supabaseAdmin.rpc('execute_sql_query', {
        sql_query: text,
        query_params: params || []
      });

      if (error) throw error;

      // Format the response to match pg's response format
      return {
        rows: data || [],
        rowCount: data ? data.length : 0,
        command: text.trim().split(' ')[0].toUpperCase()
      };
    } catch (error) {
      console.error("Supabase query error:", error);
      throw error;
    }
  }

  async end() {
    // Nothing to do here
    return Promise.resolve();
  }
}

// Create pool emulator instance
export const pool = new SupabasePoolEmulator();

/**
 * Test the Supabase connection without using direct PostgreSQL
 */
export async function testConnection() {
  try {
    // Use the Supabase Data API instead of direct SQL
    const { data, error } = await supabaseAdmin
      .from('users') // Replace with a table that exists in your database
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return { 
      success: true, 
      message: 'Supabase connection successful', 
      details: data 
    };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { 
      success: false, 
      message: 'Supabase connection failed', 
      error: error.message 
    };
  }
}

// Handler for API routes
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await testConnection();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error connecting to Supabase', 
      error: error.message 
    });
  }
}
