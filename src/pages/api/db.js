import pg from "pg";
const { Pool } = pg;

// Determine if we're in production (Vercel) or development (local)
const isProduction = process.env.VERCEL || process.env.VERCEL_ENV === 'production';

// Configure database connection based on environment
let poolConfig;

if (isProduction) {
  // Use Supabase connection URL when in production/Vercel
  const connectionString = process.env.POSTGRES_URL || 
                          process.env.POSTGRES_URL_NON_POOLING || 
                          `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}?sslmode=require`;
  
  poolConfig = {
    connectionString,
    ssl: { rejectUnauthorized: false }
  };
  
  console.log('Using production database connection with:', {
    usingConnectionString: !!connectionString,
    usingUrl: connectionString === process.env.POSTGRES_URL,
    usingNonPooling: connectionString === process.env.POSTGRES_URL_NON_POOLING,
    usingConstructed: !process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING
  });
} else {
  // Use local connection details for development
  poolConfig = {
    user: process.env.DB_USER || "openhour_admin",
    host: process.env.DB_HOST || "localhost", 
    database: process.env.DB_NAME || "openhour_database",
    password: process.env.DB_PASSWORD || "Openhour1@2",
    port: process.env.DB_PORT || 5432,
    ssl: false
  };
  console.log('Using development database connection');
}

// Handle any errors during pool creation
let pool;
try {
  pool = new Pool(poolConfig);
  
  // Test the connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection test failed:', err.message);
    } else {
      console.log('Database connection successful, server time:', res.rows[0].now);
    }
  });
} catch (error) {
  console.error('Failed to create database pool:', error.message);
  // Create a fallback pool that will throw helpful errors when used
  pool = {
    connect: () => Promise.reject(new Error(`Database connection failed: ${error.message}. Check your environment variables.`)),
    query: () => Promise.reject(new Error(`Database query failed: ${error.message}. Check your environment variables.`)),
    end: () => Promise.resolve(),
  };
}

// Export the pool for use in other files
export { pool };

// Handler for the API route
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { eventDetails, token } = req.body;
    
    // Handle the request based on the operation
    if (req.url.includes('create-shared-calendar')) {
      return await createSharedCalendar(req, res);
    } else {
      return res.status(404).json({ message: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Function to create a shared calendar
async function createSharedCalendar(req, res) {
  const { userToken, calendarDetails } = req.body;
  const { title, description, minSlotDuration, startDate, endDate } = calendarDetails;
  
  // Begin a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get user ID from token or create user if doesn't exist
    const userResult = await client.query(
      'SELECT id FROM users WHERE google_token = $1',
      [userToken.token]
    );
    
    let userId;
    if (userResult.rows.length === 0) {
      // Create new user
      const newUserResult = await client.query(
        'INSERT INTO users (google_token, created_at) VALUES ($1, NOW()) RETURNING id',
        [userToken.token]
      );
      userId = newUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }
    
    // Create the calendar
    const calendarResult = await client.query(
      `INSERT INTO calendars 
      (title, description, min_slot_duration, start_date, end_date, owner_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, invite_code`,
      [title, description, minSlotDuration, startDate, endDate, userId]
    );
    
    const calendarId = calendarResult.rows[0].id;
    const inviteCode = calendarResult.rows[0].invite_code;
    
    // Add owner as a participant
    await client.query(
      'INSERT INTO calendar_participants (calendar_id, user_id, is_owner, joined_at) VALUES ($1, $2, true, NOW())',
      [calendarId, userId]
    );
    
    await client.query('COMMIT');
    
    return res.status(200).json({ 
      message: 'Shared calendar created successfully',
      calendarId,
      inviteCode
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
