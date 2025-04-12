import { supabase, supabaseAdmin, testConnection } from '../../utils/supabase-client';

/**
 * API route to test Supabase connection without SSL issues
 * This demonstrates how to use Supabase client directly
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Test the Supabase connection
    const result = await testConnection();
    
    // Add additional information about the environment
    const environmentInfo = {
      isProduction: process.env.VERCEL || process.env.VERCEL_ENV === 'production',
      supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };

    return res.status(200).json({ 
      ...result,
      environment: environmentInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to test Supabase connection',
      error: error.message
    });
  }
}
