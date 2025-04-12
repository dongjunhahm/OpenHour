import axios from "axios";
import { pool } from "../db";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, startDate, endDate, minDuration } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [token]
    );

    const userId = userResult.rows[0].id;
    const calendarId = uuidv4();

    await client.query(
      `INSERT INTO calendars(id, creator_id, start_date, end_date, min_slot_duration, status)
            VALUES ($1, $2, $3, $4, $5, 'CREATED')`,
      [
        calendarId,
        userId,
        new Date(startDate),
        new Date(endDate),
        parseInt(minDuration.split(":")[0]),
      ]
    );

    await client.query(
      `
            INSERT INTO calendar_participants (calendar_id, user_id)
            VALUES ($1, $2)
            `,
      [calendarId, userId]
    );

    await client.query("COMMIT");

    await axios.post("/api/find-available-slots", {
      calendarId,
      token,
    });

    res.status(201).json({
      calendarId,
      message: "calendar created",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("calendar creation error:", error);
    res.status(500).json({
      message: "failed to create calendar",
      error: error.message,
    });
  } finally {
    client.release();
  }
}
