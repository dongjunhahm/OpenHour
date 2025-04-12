import { createSupabaseApiHandler, createSharedCalendar } from '../../utils/enhanced-supabase-client';

/**
 * API handler for creating shared calendars using Supabase
 * This completely avoids direct PostgreSQL connections and SSL issues
 */
async function sharedCalendarHandler(req, res) {
  const { userToken, calendarDetails } = req.body;
  
  if (!userToken || !calendarDetails) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  try {
    // Use the createSharedCalendar function from our enhanced Supabase client
    const result = await createSharedCalendar(userToken, calendarDetails);
    
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error creating shared calendar:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create shared calendar',
      error: error.message
    });
  }
}

// Wrap the handler with our createSupabaseApiHandler for consistent error handling
export default createSupabaseApiHandler(sharedCalendarHandler);
