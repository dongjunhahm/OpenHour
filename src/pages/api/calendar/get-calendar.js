import { pool } from "../db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id, token } = req.query;

  if (!id || !token) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const client = await pool.connect();

  try {
    // Verify user access
    console.log("attempting to verify user with token", token);
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [token]
    );
    console.log(
      "user verification result:",
      userResult.rows.length > 0 ? "User found" : "User not found"
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = userResult.rows[0].id;

    // Verify calendar participation
    const participantResult = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2",
      [id, userId]
    );

    if (participantResult.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Not a participant in this calendar" });
    }

    // Get calendar details
    console.log("Getting calendar details for ID:", id);
    const calendarResult = await client.query(
      `SELECT id, owner_id, title, description, start_date, end_date, min_slot_duration, created_at
       FROM calendars 
       WHERE id = $1`,
      [id]
    );
    console.log("Calendar result:", calendarResult.rows[0]);

    if (calendarResult.rows.length === 0) {
      return res.status(404).json({ message: "Calendar not found" });
    }

    return res.status(200).json(calendarResult.rows[0]);
  } catch (error) {
    console.error("Error getting calendar:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
}
