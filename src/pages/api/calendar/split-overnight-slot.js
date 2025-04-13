import { pool } from "../db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { slotId, token } = req.body;

  if (!slotId || !token) {
    return res.status(400).json({
      message: "Missing required parameters",
      required: "slotId, token",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify user access
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_token = $1",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = userResult.rows[0].id;

    // Get the slot to split
    const slotResult = await client.query(
      `SELECT id, calendar_id, start_time, end_time 
       FROM available_slots
       WHERE id = $1`,
      [slotId]
    );

    if (slotResult.rows.length === 0) {
      return res.status(404).json({ message: "Slot not found" });
    }

    const { calendar_id, start_time, end_time } = slotResult.rows[0];

    // Verify calendar participation
    const participantResult = await client.query(
      "SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2",
      [calendar_id, userId]
    );

    if (participantResult.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Not a participant in this calendar" });
    }

    // Check if slot spans midnight
    const startDay = new Date(start_time);
    const endDay = new Date(end_time);

    if (
      startDay.getDate() === endDay.getDate() &&
      startDay.getMonth() === endDay.getMonth() &&
      startDay.getFullYear() === endDay.getFullYear()
    ) {
      return res
        .status(400)
        .json({ message: "Slot does not span multiple days" });
    }

    // Calculate midnight at the end of the start day
    const midnight = new Date(
      startDay.getFullYear(),
      startDay.getMonth(),
      startDay.getDate() + 1, // Next day
      7,
      0,
      0,
      0 // 00:00:00.000
    );

    // Subtract 1 millisecond to get 23:59:59.999
    const endOfDay = new Date(midnight.getTime() - 1);

    // Delete the original slot
    await client.query("DELETE FROM available_slots WHERE id = $1", [slotId]);

    // Create the two new slots
    // First slot: from start time to end of day (23:59:59.999)
    await client.query(
      "INSERT INTO available_slots (calendar_id, start_time, end_time, created_at) VALUES ($1, $2, $3, NOW())",
      [calendar_id, start_time, endOfDay]
    );

    // Second slot: from midnight (00:00:00.000) to end time
    await client.query(
      "INSERT INTO available_slots (calendar_id, start_time, end_time, created_at) VALUES ($1, $2, $3, NOW())",
      [calendar_id, midnight, end_time]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Overnight slot successfully split",
      eveningSlot: {
        start: start_time,
        end: endOfDay.toISOString(),
      },
      morningSlot: {
        start: midnight.toISOString(),
        end: end_time,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error splitting overnight slot:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
}
