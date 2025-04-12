import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side Supabase client (limited permissions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Server-side admin client with full permissions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Execute raw SQL query - avoids SSL issues by using Supabase's RPC
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
export async function executeSQL(query, params = []) {
  try {
    // Convert params to JSON array if needed
    const jsonParams = Array.isArray(params) ? params : [params];

    // Use RPC instead of direct database connection
    const { data, error } = await supabaseAdmin.rpc('execute_sql_query', {
      sql_query: query,
      query_params: jsonParams
    });

    if (error) throw error;
    return { rows: data || [], rowCount: data ? data.length : 0 };
  } catch (error) {
    console.error('Error executing SQL via Supabase:', error);
    throw error;
  }
}

/**
 * Begin a transaction with Supabase
 * Note: Since we can't directly control transactions through REST API,
 * this emulates transaction behavior by bundling operations
 * @returns {Object} - Transaction-like object
 */
export function beginTransaction() {
  const operations = [];
  
  return {
    // Queue a query to run as part of transaction
    query: (text, params = []) => {
      operations.push({ text, params });
      return { rows: [], rowCount: 0 }; // Mock response
    },
    
    // Execute all queued queries
    commit: async () => {
      try {
        // Use a database function that executes multiple queries in a transaction
        // This would need to be implemented on the Supabase side
        const { data, error } = await supabaseAdmin.rpc('execute_transaction', {
          queries: operations.map(op => ({
            query: op.text,
            params: op.params
          }))
        });
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Transaction error:', error);
        throw error;
      }
    },
    
    // Rollback does nothing in this implementation
    rollback: async () => {
      operations.length = 0; // Just clear the operations
      return;
    },
    
    // Clean up
    release: () => {
      operations.length = 0;
    }
  };
}

/**
 * Create a shared calendar
 * @param {object} userToken - User authentication token
 * @param {object} calendarDetails - Calendar details
 * @returns {Promise<object>} - Created calendar data
 */
export async function createSharedCalendar(userToken, calendarDetails) {
  const { title, description, minSlotDuration, startDate, endDate } = calendarDetails;
  
  try {
    // Use a database function instead of running multiple queries
    const { data, error } = await supabaseAdmin.rpc('create_shared_calendar', {
      p_token: userToken.token,
      p_title: title,
      p_description: description,
      p_min_slot_duration: minSlotDuration,
      p_start_date: startDate,
      p_end_date: endDate
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating shared calendar:', error);
    throw error;
  }
}

/**
 * Function to test the Supabase connection
 */
export async function testConnection() {
  try {
    // Just query version info - this is a simple safe query
    const { data, error } = await supabaseAdmin.rpc('execute_sql_query', {
      sql_query: 'SELECT version() as version',
      query_params: []
    });
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Supabase connection successful',
      version: data[0]?.version || 'Unknown'
    };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return {
      success: false,
      message: 'Supabase connection failed',
      error: error.message
    };
  }
}

/**
 * Create an API route handler that uses Supabase
 */
export function createSupabaseApiHandler(handlerFunction) {
  return async function handler(req, res) {
    try {
      // Pass the Supabase clients to the handler function
      return await handlerFunction(req, res, { supabase, supabaseAdmin, executeSQL });
    } catch (error) {
      console.error('API handler error:', error);
      return res.status(500).json({ 
        message: 'Server error', 
        error: error.message 
      });
    }
  };
}
