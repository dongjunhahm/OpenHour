import { createSupabaseApiHandler, createSharedCalendar } from '../../../utils/supabase-client';

// Handler for creating a shared calendar
async function handler(req, res, supabase) {
  try {
    const { userToken, calendarDetails } = req.body;
    
    if (!userToken || !calendarDetails) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const result = await createSharedCalendar(userToken, calendarDetails);
    
    return res.status(200).json({
      message: 'Shared calendar created successfully',
      calendarId: result.calendar_id,
      inviteCode: result.invite_code
    });
  } catch (error) {
    console.error('Error creating calendar:', error);
    return res.status(500).json({ message: 'Failed to create calendar', error: error.message });
  }
}

// Export the handler wrapped with Supabase API handler
export default createSupabaseApiHandler(handler);
