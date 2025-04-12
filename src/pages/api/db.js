import "pg";

const Pool = require("pg").Pool;
const pool = new Pool({
  user: process.env.DB_USER || "openhour_admin",
  host: process.env.DB_HOST || "localhost", 
  database: process.env.DB_NAME || "openhour_database",
  password: process.env.DB_PASSWORD || "Openhour1@2",
  port: process.env.DB_PORT || 5432,
});

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
