import { pool } from './db';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { calendarId, token, recipientEmail } = req.body;

  if (!calendarId || !token || !recipientEmail) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verify the user has access to the calendar
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
    
    // Check if the user is already invited
    const existingInviteResult = await client.query(
      'SELECT id FROM invitations WHERE calendar_id = $1 AND recipient_email = $2 AND status = $3',
      [calendarId, recipientEmail, 'pending']
    );
    
    if (existingInviteResult.rows.length > 0) {
      return res.status(409).json({ message: 'User already has a pending invitation' });
    }
    
    // Create the invitation
    await client.query(
      'INSERT INTO invitations (calendar_id, sender_id, recipient_email, status, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [calendarId, userId, recipientEmail, 'pending']
    );
    
    // Get the calendar details
    const calendarResult = await client.query(
      'SELECT title, invite_code FROM calendars WHERE id = $1',
      [calendarId]
    );
    
    const calendarTitle = calendarResult.rows[0].title;
    const inviteCode = calendarResult.rows[0].invite_code;
    
    await client.query('COMMIT');
    
    // Send email invitation if you have an email service configured
    // For now, we'll just return the invitation details
    return res.status(200).json({ 
      message: 'Invitation sent successfully',
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join-calendar/${inviteCode}`,
      calendarTitle: calendarTitle
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending invitation:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
}
