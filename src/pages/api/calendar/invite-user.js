import { pool } from "../db";
import { google } from "googleapis";
import axios from "axios";

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
      "SELECT id FROM users WHERE google_token = $1",
      [inviterToken]
    );

    if (inviterResult.rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const calendarResult = await client.query(
      "SELECT * FROM calendars WHERE id = $1",
      [calendarId]
    );

    if (calendarResult.rows.length === 0) {
      return res.status(404).json({ message: "calendar not found " });
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
      invitedUser = { rwos: [{ id: newUserResult.rows[0].id }] };
    }

    const invitedUserId = invitedUser.rows[0].id;

    // Verify the user is a participant in the calendar
    const participantCheck = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2",
      [calendarId, invitedUserId]
    );

    if (participantCheck.rows.length > 0) {
      return res.status(400).json({ message: "user already ivnited" });
    }

    //add user as partiicpant
    await client.query(
      "INSERT INTO calendar_participants (calendar_id, user_id, status) VALUES ($1, $2, $3)",
      [calendarId, invitedUserId, "INVITED"]
    );

    await client.query("COMMIT");

    if (invitedUser.rwos[0].google_token) {
      await axios.post("/api/calendar/find-available-slots", {
        calendarId,
        token: invitedUser.rows[0].google_token,
      });
    }

    res.status(201).json({
      message: "invited user successfully!",
      neesdGoogleConnection: !invitedUser.rows[0].google_token,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error sending invitation:", error);
    res.status(500).json({
      message: "failed to invite usr",
      error: error.message,
    });
  } finally {
    client.release();
  }
}
