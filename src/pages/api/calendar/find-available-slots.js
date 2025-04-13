import { pool } from "../db";
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "method not allowed" });
  }

  const { calendarId, token } = req.body;

  if (!calendarId || !token) {
    return res.status(400).json({ message: "missing required fields" });
  }

  const client = await pool.connect();

  try {
    //getting userId and verifying access
    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "unauthorized" });
    }

    const userId = userResult.rows[0].id;

    //verify if the user is in the calendar

    const participantResult = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 and user_id = $2",
      [calendarId, userId]
    );

    if (participantResult.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "not a participant in teh calendar" });
    }

    //get calendar details

    const calendarResult = await client.query(
      "SELECT min_Slot_duration, start_date, end_date FROM calendars WHERE id = $1",
      [calendarId]
    );

    if (calendarResult.rows.length === 0) {
      return res.status(404).json({ message: "calendar not found" });
    }

    const { min_slot_duration, start_date, end_date } = calendarResult.rows[0];

    //get all participants in the claendar
    const participantsResult = await client.query(
      `SELECT u.id, u.google_token
            FROM calendar_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.calendar_id = $1`,
      [calendarId]
    );
    //proccess each calendar
    const allEvents = [];

    for (const participant of participantsResult.rows) {
      if (participant.google_token) {
        try {
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials({
            access_token: participant.google_token,
          });
          const calendar = google.calendar({
            version: "v3",
            auth: oauth2Client,
          });

          const events = await calendar.events.list({
            calendarId: "primary",
            timeMin: start_date.toISOString(),
            timeMax: end_date.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
          });

          if (events.data.items && events.data.items.length > 0) {
            allEvents.push(
              ...events.data.items.map((event) => ({
                start: new Date(event.start.dateTime || event.start.date),
                end: new Date(event.end.dateTime || event.end.date),
                userId: participant.id,
              }))
            );
          }
        } catch (error) {
          console.error(
            `error getting events for uesr ${participant.id}:`,
            error
          );
          //continue if you want for other participants
        }
      }
    }

    //finding avaialble slots

    const startTime = new Date(start_date);
    const endTime = new Date(end_date);
    const minDuration = min_slot_duration * 60 * 1000;

    allEvents.sort((a, b) => a.start - b.start);

    const availableSlots = [];
    let currentTime = startTime;

    for (const event of allEvents) {
      if (event.start > currentTime) {
        //gap exists
        const gap = event.start - currentTime;
        if (gap >= minDuration) {
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(event.start),
            duration: gap / (60 * 1000),
          });
        }
      }

      //update current time
      if (event.end > currentTime) {
        currentTime = new Date(event.end);
      }
    }

    //chec, if there is time after teh last event
    if (currentTime < endTime) {
      const gap = endTime - currentTime;
      if (gap >= minDuration) {
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(endTime),
          duration: gap / (60 * 1000),
        });
      }
    }

    //storing availbale slots in teh database
    //fewf
    for (const slot of availableSlots) {
      await client.query(
        "INSERT INTO available_slots (calendar_id, start_time, end_time, created_at) VALUES ($1, $2, $3, NOW())",
        [calendarId, slot.start, slot.end]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "avaialble sltos found",
      availableSlots,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error finding available slots:", error);
    return res
      .status(500)
      .json({ message: "server error", error: error.message });
  } finally {
    client.release();
  }
}
