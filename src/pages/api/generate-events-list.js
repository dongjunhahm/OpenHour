import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { token } = req.body;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const listedEvents = await calendar.events.list({
      calendarId: "primary",
      maxResults: 10,
    });
    const response = listedEvents.data.items;

    console.log("evenst found :", listedEvents.data.items);
    res.status(200).json({ message: "Events Found", event: response.data });
  } catch (error) {
    console.error("Error finding events:", error.message);
    res.status(500).json({ error: "error finding events" });
  }
}
