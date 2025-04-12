import { google } from "googleapis";
const pool = require("../db");

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Handle GET request for fetching events
    try {
      // Assuming user authentication is handled elsewhere
      // and req.user is available
      const userId = req.query.userId; // Get userId from query params
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const result = await pool.query("SELECT * FROM events WHERE user_id = $1", [userId]);
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Server error fetching events" });
    }
  } else if (req.method === 'POST') {
    // Handle POST request for Google Calendar events
    try {
      const { token } = req.body;
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: token });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const listedEvents = await calendar.events.list({
        calendarId: "primary",
        maxResults: 50,
      });
      const response = { listedEvents };

      console.log("events found:", listedEvents);
      return res.status(200).json({ message: "Events Found", event: response.data });
    } catch (error) {
      console.error("Error finding events:", error.message);
      return res.status(500).json({ error: "Error finding events" });
    }
  } else {
    // Handle unsupported methods
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
