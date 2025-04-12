import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Standard client for client-side operations with anonymous key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Admin client with service role key (for server-side operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false
  }
});

/**
 * Execute a raw SQL query using Supabase's PostgreSQL function
 * This completely avoids direct Postgres connections and SSL issues
 * 
 * @param {string} query - SQL query to execute
 * @param {Array} params - Array of parameters to pass to the query
 * @returns {Promise<object>} - Query results
 */
export async function executeSQL(query, params = []) {
  try {
    // Using RPC to execute SQL (this requires a PostgreSQL function in Supabase)
    // You'll need to create this function in your Supabase instance 
    const { data, error } = await supabaseAdmin.rpc('execute_sql_query', {
      sql_query: query,
      query_params: params
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

/**
 * Get user by Google token
 * @param {string} googleToken - Google auth token
 * @returns {Promise<object>} - User data
 */
export async function getUserByToken(googleToken) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('google_token', googleToken)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user by token:', error);
    throw error;
  }
}

/**
 * Create a new user
 * @param {string} googleToken - Google auth token
 * @returns {Promise<object>} - New user data
 */
export async function createUser(googleToken) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        google_token: googleToken,
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Create a shared calendar
 * @param {object} userToken - User authentication token
 * @param {object} calendarDetails - Calendar details
 * @returns {Promise<object>} - Created calendar data
 */
export async function createSharedCalendar(userToken, calendarDetails) {
  const { title, description, minSlotDuration, startDate, endDate } = calendarDetails;
  
  // Get user ID or create new user
  let userId;
  const existingUser = await getUserByToken(userToken.token);
  
  if (existingUser) {
    userId = existingUser.id;
  } else {
    const newUser = await createUser(userToken.token);
    userId = newUser.id;
  }
  
  try {
    // Create the calendar
    const { data: calendar, error: calendarError } = await supabaseAdmin
      .from('calendars')
      .insert([{
        title,
        description,
        min_slot_duration: minSlotDuration,
        start_date: startDate,
        end_date: endDate,
        owner_id: userId,
        created_at: new Date().toISOString()
      }])
      .select('id, invite_code')
      .single();
    
    if (calendarError) throw calendarError;
    
    // Add owner as a participant
    const { error: participantError } = await supabaseAdmin
      .from('calendar_participants')
      .insert([{
        calendar_id: calendar.id,
        user_id: userId,
        is_owner: true,
        joined_at: new Date().toISOString()
      }]);
    
    if (participantError) throw participantError;
    
    return {
      message: 'Shared calendar created successfully',
      calendarId: calendar.id,
      inviteCode: calendar.invite_code
    };
  } catch (error) {
    console.error('Error creating shared calendar:', error);
    throw error;
  }
}

/**
 * Creating a wrapper function for API handlers to use Supabase
 * This replaces the need for direct PostgreSQL connections
 */
export function createSupabaseApiHandler(handlerFunction) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
      // Execute the handler with supabase clients available
      return await handlerFunction(req, res, { supabase, supabaseAdmin });
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
}

/**
 * Function to test Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    // Simple query to check if Supabase is working
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Supabase connection successful',
      userCount: data
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
