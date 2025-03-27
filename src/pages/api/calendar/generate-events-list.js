import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { token } = req.body;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const listedEvents = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(), // Only get future events
      orderBy: "startTime",
      singleEvents: true, // Expand recurring events
      maxResults: 10,
    });
    const response = listedEvents.data.items;

    //console.log("events found:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error finding events:", error.message);
    res.status(500).json({ error: "error finding events" });
  }
}
