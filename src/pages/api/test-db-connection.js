import { pool } from './db';

export default async function handler(req, res) {
  try {
    // Test query to verify connection
    const result = await pool.query('SELECT NOW()');
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      serverTime: result.rows[0].now
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
}
