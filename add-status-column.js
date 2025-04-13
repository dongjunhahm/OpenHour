import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Create a connection pool
const Pool = pg.Pool;
const pool = new Pool({
  user: process.env.DB_USER || "openhour_admin",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "openhour_database",
  password: process.env.DB_PASSWORD || "Openhour1@2",
  port: process.env.DB_PORT || 5432,
});

async function addStatusColumn() {
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log("Connected to PostgreSQL database");

    // Check if the column already exists
    const checkColumnResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'calendar_participants' AND column_name = 'status'
    `);

    if (checkColumnResult.rows.length === 0) {
      console.log("Status column does not exist. Adding it now...");
      
      // Add the status column
      await client.query(`
        ALTER TABLE calendar_participants 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pending'
      `);
      
      console.log("Status column added successfully!");
    } else {
      console.log("Status column already exists.");
    }

    // Release the client back to the pool
    client.release();
    console.log("Migration complete!");

    // Close the pool
    await pool.end();
  } catch (error) {
    console.error("Error adding status column:", error.message);
    process.exit(1);
  }
}

// Run the migration
addStatusColumn();
