import { pool } from "../db";
import { google } from "googleapis";
import axios from "axios";
import { sendInvitationEmail } from "../../../utils/sendgrid";
import { generateInviteToken } from "../../../utils/tokens";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { calendarId, invitedEmail, inviterToken } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify the user has access to the calendar
    const inviterResult = await client.query(
      "SELECT id, name, email FROM users WHERE google_token = $1",
      [inviterToken]
    );

    if (inviterResult.rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const calendarResult = await client.query(
      "SELECT id, title, description, start_date, end_date FROM calendars WHERE id = $1",
      [calendarId]
    );

    if (calendarResult.rows.length === 0) {
      return res.status(404).json({ message: "Calendar not found" });
    }

    let invitedUser = await client.query(
      "SELECT id, google_token FROM users WHERE email = $1",
      [invitedEmail]
    );

    if (invitedUser.rows.length === 0) {
      const newUserResult = await client.query(
        "INSERT INTO users (email, created_at) VALUES ($1, NOW()) RETURNING id",
        [invitedEmail]
      );
      invitedUser = { rows: [{ id: newUserResult.rows[0].id }] };
    }

    const invitedUserId = invitedUser.rows[0].id;

    // Verify the user is a participant in the calendar
    const participantCheck = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2",
      [calendarId, invitedUserId]
    );

    if (participantCheck.rows.length > 0) {
      return res.status(400).json({ message: "User already invited" });
    }

    //add user as participant
    await client.query(
      "INSERT INTO calendar_participants (calendar_id, user_id) VALUES ($1, $2)",
      [calendarId, invitedUserId]
    );

    await client.query("COMMIT");

    if (invitedUser.rows[0].google_token) {
      await axios.post("/api/calendar/find-available-slots", {
        calendarId,
        token: invitedUser.rows[0].google_token,
      });
    }

    res.status(201).json({
      message: "Invited user successfully!",
      needsGoogleConnection: !invitedUser.rows[0].google_token,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error sending invitation:", error);
    res.status(500).json({
      message: "Failed to invite user",
      error: error.message,
    });
  } finally {
    client.release();
  }
}
