import { testSupabaseConnection } from '../../utils/enhanced-supabase-client';

export default async function handler(req, res) {
  try {
    const result = await testSupabaseConnection();
    
    return res.status(200).json({
      ...result,
      timestamp: new Date().toISOString(),
      message: 'Supabase enhanced client connection test'
    });
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to test Supabase connection',
      error: error.message
    });
  }
}
