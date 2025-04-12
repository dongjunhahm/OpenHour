import { pool } from "../db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { calendarId, token } = req.query;

  if (!calendarId || !token) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const client = await pool.connect();

  try {
    // Verify user access
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = userResult.rows[0].id;

    // Verify calendar participation
    const participantResult = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2",
      [calendarId, userId]
    );

    if (participantResult.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Not a participant in this calendar" });
    }

    // Get available slots
    const slotsResult = await client.query(
      `SELECT id, start_time as start, end_time as end, 
              EXTRACT(EPOCH FROM (end_time - start_time)) / 60 as duration
       FROM available_slots
       WHERE calendar_id = $1
       ORDER BY start_time ASC`,
      [calendarId]
    );

    return res.status(200).json({
      availableSlots: slotsResult.rows,
    });
  } catch (error) {
    console.error("Error getting available slots:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
}
