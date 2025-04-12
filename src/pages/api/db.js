import pg from "pg";
const { Pool } = pg;

// Determine if we're in production (Vercel or Render) or development (local)
const isProduction =
  process.env.VERCEL || process.env.VERCEL_ENV === "production" || process.env.RENDER;

// Configure database connection based on environment
let poolConfig;

if (isProduction) {
  // Check for both Render and Vercel PostgreSQL URLs
  const connectionString = process.env.DATABASE_URL || 
                          process.env.POSTGRES_URL || 
                          process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    console.error('No database connection string found in environment variables');
  } else {
    console.log('Connection string found:', connectionString ? 'Available' : 'Not available');
  }

  poolConfig = {
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Render/Vercel managed PostgreSQL
    },
    // Add connection pool settings for better stability
    max: 20, // Maximum number of clients the pool should contain
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait for a connection to become available
  };

  console.log("Using production database with connection string");
} else {
  // Use local connection details for development
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: false,
  };
  console.log("Using development database connection");
}

// Handle any errors during pool creation
let pool;
try {
  pool = new Pool(poolConfig);

  // Add error handler to prevent crashes from lost connections
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  // Test the connection
  pool.query("SELECT NOW()", (err, res) => {
    if (err) {
      console.error("Database connection test failed:", err.message);
    } else {
      console.log(
        "Database connection successful, server time:",
        res.rows[0].now
      );
    }
  });
} catch (error) {
  console.error("Failed to create database pool:", error.message);
  // Create a fallback pool that will throw helpful errors when used
  pool = {
    connect: () =>
      Promise.reject(
        new Error(
          `Database connection failed: ${error.message}. Check your environment variables.`
        )
      ),
    query: () =>
      Promise.reject(
        new Error(
          `Database query failed: ${error.message}. Check your environment variables.`
        )
      ),
    end: () => Promise.resolve(),
  };
}

// Export the pool for use in other files
export { pool };

// Handler for the API route
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { eventDetails, token } = req.body;

    // Handle the request based on the operation
    if (req.url.includes("create-shared-calendar")) {
      return await createSharedCalendar(req, res);
    } else {
      return res.status(404).json({ message: "Endpoint not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}

// Function to create a shared calendar
async function createSharedCalendar(req, res) {
  const { userToken, calendarDetails } = req.body;
  const { title, description, minSlotDuration, startDate, endDate } =
    calendarDetails;

  // Begin a transaction
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get user ID from token or create user if doesn't exist
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [userToken.token]
    );

    let userId;
    if (userResult.rows.length === 0) {
      // Create new user
      const newUserResult = await client.query(
        "INSERT INTO users (google_token, created_at) VALUES ($1, NOW()) RETURNING id",
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
      "INSERT INTO calendar_participants (calendar_id, user_id, is_owner, joined_at) VALUES ($1, $2, true, NOW())",
      [calendarId, userId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Shared calendar created successfully",
      calendarId,
      inviteCode,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
