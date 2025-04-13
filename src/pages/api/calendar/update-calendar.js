import { pool } from "../db";
// For WebSocket notification
import { getIO } from '../websocket';

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { calendarId, title, token } = req.body;

  if (!calendarId || !title || !token) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const client = await pool.connect();

  try {
    // Verify user exists
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = userResult.rows[0].id;

    // Check if user is owner of the calendar
    const ownershipCheck = await client.query(
      `SELECT * FROM calendar_participants 
       WHERE calendar_id = $1 AND user_id = $2 AND is_owner = true`,
      [calendarId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ message: "Only the calendar owner can update the title" });
    }

    // Update the calendar title
    const updateResult = await client.query(
      "UPDATE calendars SET title = $1 WHERE id = $2 RETURNING id, title",
      [title, calendarId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: "Calendar not found" });
    }

    // Notify connected clients via WebSocket if available
    // Try using the getIO helper function first
    const io = getIO();
    if (io) {
      io.to(`calendar-${calendarId}`).emit('calendarUpdated', {
        title: title,
        calendarId: calendarId
      });
      console.log(`WebSocket notification sent for calendar ${calendarId} updated via getIO()`);
    } else if (res.socket && res.socket.server && res.socket.server.io) {
      // Fallback to the socket server if available directly
      const serverIO = res.socket.server.io;
      serverIO.to(`calendar-${calendarId}`).emit('calendarUpdated', {
        title: title,
        calendarId: calendarId
      });
      console.log(`WebSocket notification sent for calendar ${calendarId} updated via server.io`);
    } else {
      console.log('WebSocket server not initialized, notification not sent');
    }

    return res.status(200).json({
      message: "Calendar title updated successfully",
      calendar: updateResult.rows[0]
    });
  } catch (error) {
    console.error("Error updating calendar title:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
}
