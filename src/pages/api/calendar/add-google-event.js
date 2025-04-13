import axios from "axios";
import { pool } from "../db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, calendarId, eventName, startTime, endTime } = req.body;
  
  if (!token || !calendarId || !eventName || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const client = await pool.connect();

  try {
    // Get all participants' information for this calendar
    const participantsResult = await client.query(
      `SELECT u.email 
       FROM calendar_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.calendar_id = $1 AND u.email IS NOT NULL`,
      [calendarId]
    );

    const participants = participantsResult.rows;
    
    // Get current user's email
    const userResult = await client.query(
      `SELECT email FROM users WHERE google_token = $1`,
      [token]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userEmail = userResult.rows[0].email;

    // Set up the Google Calendar API request with the OAuth token
    const googleCalendarEndpoint = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Create list of attendees (all participants except current user)
    const attendees = participants
      .filter(p => p.email !== userEmail && p.email)
      .map(p => ({ email: p.email }));

    // Build the event data
    const eventData = {
      summary: eventName,
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'America/Los_Angeles'
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'America/Los_Angeles'
      },
      attendees: attendees,
      sendUpdates: 'all' // This will send email notifications to attendees
    };

    // Add the event to Google Calendar
    const response = await axios.post(googleCalendarEndpoint, eventData, { headers });

    res.status(201).json({
      message: "Event created successfully",
      eventId: response.data.id,
      eventLink: response.data.htmlLink
    });
  } catch (error) {
    console.error("Error creating Google Calendar event:", error.response?.data || error.message);
    
    let errorMessage = "Failed to create Google Calendar event";
    
    // Check for specific Google API errors
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }
    
    res.status(500).json({
      message: errorMessage,
      error: error.message
    });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error("Error releasing client:", releaseError.message);
      }
    }
  }
}
