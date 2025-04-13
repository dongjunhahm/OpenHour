import { pool } from "../db";
import { google } from "googleapis";
import { getIO } from "../websocket";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { inviteCode, token } = req.body;

  if (!inviteCode || !token) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get user ID from token or create user if doesn't exist
    const userResult = await client.query(
      "SELECT id, email FROM users WHERE google_token = $1",
      [token]
    );

    let userId, userEmail;
    if (userResult.rows.length === 0) {
      // User not found, we need to get their info from Google
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: token });

      // Get user info from Google
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
      });

      const userInfo = await oauth2.userinfo.get();
      userEmail = userInfo.data.email;

      // Create new user
      const newUserResult = await client.query(
        "INSERT INTO users (google_token, email, name, profile_picture, created_at, last_login) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id",
        [token, userInfo.data.email, userInfo.data.name, userInfo.data.picture]
      );
      userId = newUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
      userEmail = userResult.rows[0].email;

      // Update last login
      await client.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
        userId,
      ]);
    }

    // Find the calendar by invite code
    const calendarResult = await client.query(
      "SELECT id, title FROM calendars WHERE invite_code = $1",
      [inviteCode]
    );

    if (calendarResult.rows.length === 0) {
      return res.status(404).json({ message: "Calendar not found" });
    }

    const calendarId = calendarResult.rows[0].id;
    const calendarTitle = calendarResult.rows[0].title;

    // Check if user is already a participant
    const participantResult = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2",
      [calendarId, userId]
    );

    if (participantResult.rows.length > 0) {
      // User is already a participant
      await client.query("COMMIT");
      return res.status(200).json({
        message: "You are already a participant in this calendar",
        calendarId,
        calendarTitle,
      });
    }

    // Check for an invitation for this email
    const invitationResult = await client.query(
      "SELECT id FROM invitations WHERE calendar_id = $1 AND recipient_email = $2 AND status = $3",
      [calendarId, userEmail, "pending"]
    );

    // Check if user is already a participant but hasn't joined yet (special date '9999-12-31')
    const pendingCheckResult = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2 AND joined_at = '9999-12-31'",
      [calendarId, userId]
    );

    if (pendingCheckResult.rows.length > 0) {
      // Update existing participant to set joined_at timestamp
      await client.query(
        "UPDATE calendar_participants SET joined_at = NOW() WHERE id = $1",
        [pendingCheckResult.rows[0].id]
      );
    } else {
      // Add user as a new participant with joined_at timestamp
      await client.query(
        "INSERT INTO calendar_participants (calendar_id, user_id, is_owner, joined_at) VALUES ($1, $2, false, NOW())",
        [calendarId, userId]
      );
    }

    // If there was an invitation, update its status
    if (invitationResult.rows.length > 0) {
      await client.query(
        "UPDATE invitations SET status = $1, responded_at = NOW() WHERE id = $2",
        ["accepted", invitationResult.rows[0].id]
      );
    }

    await client.query("COMMIT");

    // Notify all users via WebSocket that a new user has joined
    const io = getIO();
    if (io) {
      // Broadcast to all users in the calendar room that someone has joined
      // Include the isNewUser flag to indicate this is a user join event (not just a socket connection)
      io.to(`calendar-${calendarId}`).emit('userJoined', {
        count: 0, // The count will be calculated client-side when they receive the event
        isNewUser: true // Flag indicating this is a new user join event
      });
      
      console.log(`WebSocket notification sent for user joining calendar ${calendarId}`);
    } else {
      console.log('WebSocket server not available for notifications');
    }

    return res.status(200).json({
      message: "Successfully joined the calendar",
      calendarId,
      calendarTitle,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error joining calendar:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
}
