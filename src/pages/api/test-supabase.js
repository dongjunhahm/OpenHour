import { testSupabaseConnection } from './supabaseDb';
import { supabase } from './supabaseDb';

export default async function handler(req, res) {
  try {
    // Test direct PostgreSQL connection
    const pgResult = await testSupabaseConnection();
    
    // Test Supabase client connection
    const { data: supabaseData, error: supabaseError } = await supabase.from('users').select('count(*)').limit(1);
    
    return res.status(200).json({
      postgres: pgResult.success ? 
        { message: 'Successfully connected to PostgreSQL', timestamp: pgResult.timestamp } : 
        { message: 'Failed to connect to PostgreSQL', error: pgResult.error },
      supabase: supabaseError ? 
        { message: 'Failed to connect to Supabase', error: supabaseError.message } : 
        { message: 'Successfully connected to Supabase', data: supabaseData },
      environment: {
        // Show partial connection info for debugging (hide full credentials)
        postgres_host: process.env.POSTGRES_HOST ? `...${process.env.POSTGRES_HOST.slice(-5)}` : 'not set',
        postgres_user: process.env.POSTGRES_USER ? `exists (${process.env.POSTGRES_USER.length} chars)` : 'not set',
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'exists' : 'not set',
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error testing connections',
      error: error.message
    });
  }
}
