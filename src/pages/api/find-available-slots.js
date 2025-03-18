import { pool } from './db';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { calendarId, token } = req.body;

  if (!calendarId || !token) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get user ID and verify access
    const userResult = await client.query(
      'SELECT id FROM users WHERE google_token = $1',
      [token]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Verify the user is a participant in the calendar
    const participantResult = await client.query(
      'SELECT id FROM calendar_participants WHERE calendar_id = $1 AND user_id = $2',
      [calendarId, userId]
    );
    
    if (participantResult.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a participant in this calendar' });
    }
    
    // Get calendar details
    const calendarResult = await client.query(
      'SELECT min_slot_duration, start_date, end_date FROM calendars WHERE id = $1',
      [calendarId]
    );
    
    if (calendarResult.rows.length === 0) {
      return res.status(404).json({ message: 'Calendar not found' });
    }
    
    const { min_slot_duration, start_date, end_date } = calendarResult.rows[0];
    
    // Get all participants for this calendar
    const participantsResult = await client.query(
      `SELECT u.id, u.google_token 
       FROM calendar_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.calendar_id = $1`,
      [calendarId]
    );
    
    // Process each participant's calendar
    const allEvents = [];
    
    for (const participant of participantsResult.rows) {
      if (participant.google_token) {
        try {
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials({ access_token: participant.google_token });
          const calendar = google.calendar({ version: "v3", auth: oauth2Client });
          
          const events = await calendar.events.list({
            calendarId: "primary",
            timeMin: start_date.toISOString(),
            timeMax: end_date.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
          });
          
          if (events.data.items && events.data.items.length > 0) {
            allEvents.push(...events.data.items.map(event => ({
              start: new Date(event.start.dateTime || event.start.date),
              end: new Date(event.end.dateTime || event.end.date),
              userId: participant.id
            })));
          }
        } catch (error) {
          console.error(`Error fetching events for user ${participant.id}:`, error);
          // Continue with other participants
        }
      }
    }
    
    // Now find available slots
    const startTime = new Date(start_date);
    const endTime = new Date(end_date);
    const minDuration = min_slot_duration * 60 * 1000; // Convert minutes to milliseconds
    
    // Sort all events by start time
    allEvents.sort((a, b) => a.start - b.start);
    
    // Find available slots
    const availableSlots = [];
    let currentTime = startTime;
    
    for (const event of allEvents) {
      if (event.start > currentTime) {
        // We have a gap
        const gap = event.start - currentTime;
        if (gap >= minDuration) {
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(event.start),
            duration: gap / (60 * 1000) // Convert to minutes
          });
        }
      }
      
      // Update current time if necessary
      if (event.end > currentTime) {
        currentTime = new Date(event.end);
      }
    }
    
    // Check if there's available time after the last event
    if (currentTime < endTime) {
      const gap = endTime - currentTime;
      if (gap >= minDuration) {
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(endTime),
          duration: gap / (60 * 1000) // Convert to minutes
        });
      }
    }
    
    // Store the available slots in the database
    for (const slot of availableSlots) {
      await client.query(
        'INSERT INTO available_slots (calendar_id, start_time, end_time, created_at) VALUES ($1, $2, $3, NOW())',
        [calendarId, slot.start, slot.end]
      );
    }
    
    await client.query('COMMIT');
    
    return res.status(200).json({ 
      message: 'Available slots found',
      availableSlots
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error finding available slots:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
}
