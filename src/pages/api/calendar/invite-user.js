import { pool } from "../db";
import axios from "axios";
import {
  sendInvitationEmail,
  isSendGridConfigured,
} from "../../../utils/sendgrid";
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

    const inviterName =
      inviterResult.rows[0].name || inviterResult.rows[0].email;
    const inviterId = inviterResult.rows[0].id;

    const calendarResult = await client.query(
      "SELECT id, title, description, start_date, end_date FROM calendars WHERE id = $1",
      [calendarId]
    );

    if (calendarResult.rows.length === 0) {
      return res.status(404).json({ message: "Calendar not found" });
    }

    const calendarTitle = calendarResult.rows[0].title;

    // Check if the inviter has access to the calendar
    const inviterAccessCheck = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2",
      [calendarId, inviterId]
    );

    if (inviterAccessCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "You don't have access to this calendar" });
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

    // Verify the user is not already a participant in the calendar
    const participantCheck = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2",
      [calendarId, invitedUserId]
    );

    if (participantCheck.rows.length > 0) {
      return res.status(400).json({ message: "User already invited" });
    }

    // Add user as participant
    await client.query(
      "INSERT INTO calendar_participants (calendar_id, user_id) VALUES ($1, $2)",
      [calendarId, invitedUserId]
    );

    // Generate the invitation URL
    const inviteUrl = `${
      req.headers.origin || process.env.NEXT_PUBLIC_BASE_URL
    }/join-calendar/${calendarId}`;

    // Send the invitation email
    let emailResult = { status: 'Not sent', mailSent: false };
    try {
      if (isSendGridConfigured()) {
        emailResult = await sendInvitationEmail(
          invitedEmail,
          inviterName,
          calendarTitle,
          inviteUrl
        );
        console.log("Email status:", emailResult.status || "Sent");
      } else {
        console.log("SendGrid not configured, skipping email send");
        emailResult = { status: 'Email service not configured', mailSent: false };
      }
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      emailResult = {
        status: "Error",
        mailSent: false,
        error: emailError.message,
      };
      // Continue with the process even if email fails
    }

    await client.query("COMMIT");

    // If the invited user has a Google token, try to find available slots
    if (invitedUser.rows[0].google_token) {
      try {
        await axios.post(
          `${
            req.headers.origin || process.env.NEXT_PUBLIC_BASE_URL
          }/api/calendar/find-available-slots`,
          {
            calendarId,
            token: invitedUser.rows[0].google_token,
          }
        );
      } catch (slotError) {
        console.error("Error finding available slots:", slotError);
        // This is non-critical, so we continue
      }
    }

    res.status(201).json({
      message: "Invited user successfully!",
      needsGoogleConnection: !invitedUser.rows[0].google_token,
      calendarTitle,
      invitedEmail,
      emailStatus: emailResult?.mailSent === false ? "failed" : "sent",
      emailService: isSendGridConfigured() ? "SendGrid" : "Nodemailer",
      emailDetails: emailResult // Include more details about the email sending result
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
