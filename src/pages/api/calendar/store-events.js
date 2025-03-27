const pool = require("../db");

import { google } from "googleapis";

export default async function handler(req, res) {
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

    console.log("events found :", listedEvents);
    res.status(200).json({ message: "Events Found", event: response.data });
  } catch (error) {
    console.error("Error finding events:", err.message);
    res.status(500).json({ error: "error finding events" });
  }
}

const pool = require("../db");

app.get("/events", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events WHERE user_id = $1", [
      req.user.id,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
