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

    // Get all participants
    const participantsResult = await client.query(
      `SELECT u.id, u.name, u.email, cp.joined_at
       FROM calendar_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.calendar_id = $1
       ORDER BY cp.joined_at ASC`,
      [calendarId]
    );

    return res.status(200).json({
      participants: participantsResult.rows,
    });
  } catch (error) {
    console.error("Error getting participants:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
}
