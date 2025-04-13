import { pool } from "../db";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { calendarId, token } = req.query;

  if (!calendarId || !token) {
    return res.status(400).json({ message: "Missing calendarId or token parameter" });
  }

  const client = await pool.connect();

  try {
    // Get user ID from token
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Check if the user is a participant and specifically an owner of the calendar
    const participantResult = await client.query(
      "SELECT is_owner FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2",
      [calendarId, userId]
    );

    if (participantResult.rows.length === 0) {
      return res.status(403).json({ message: "You are not a participant of this calendar" });
    }

    // Only the owner can delete the calendar
    if (!participantResult.rows[0].is_owner) {
      return res.status(403).json({ message: "Only the calendar owner can delete it" });
    }

    // Begin transaction
    await client.query("BEGIN");

    // Delete all participants
    await client.query(
      "DELETE FROM calendar_participants WHERE calendar_id = $1",
      [calendarId]
    );

    // Delete all events (if applicable)
    // This assumes there's an events table related to calendars
    try {
      await client.query(
        "DELETE FROM events WHERE calendar_id = $1",
        [calendarId]
      );
    } catch (error) {
      // If there's no events table or relation, we can continue
      console.log("No events to delete or events table doesn't exist");
    }

    // Delete the calendar
    await client.query(
      "DELETE FROM calendars WHERE id = $1",
      [calendarId]
    );

    // Commit transaction
    await client.query("COMMIT");

    return res.status(200).json({ message: "Calendar deleted successfully" });
  } catch (error) {
    // Rollback in case of error
    await client.query("ROLLBACK");
    
    console.error("Error deleting calendar:", error);
    return res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  } finally {
    // Release client
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error("Error releasing client:", releaseError.message);
      }
    }
  }
}
