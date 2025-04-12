import axios from 'axios';
import { supabase } from './supabase-client';

/**
 * Create a shared calendar
 * @param {Object} userToken - User's authentication token
 * @param {Object} calendarDetails - Calendar details
 * @returns {Promise} - Result of API call
 */
export async function createSharedCalendar(userToken, calendarDetails) {
  // Try using the API first (which avoids SSL issues)
  try {
    const response = await axios.post('/api/calendar/create', {
      userToken,
      calendarDetails
    });
    return response.data;
  } catch (error) {
    console.error('API error, falling back to Supabase RPC:', error);
    // Fallback to direct Supabase RPC call
    try {
      const { data, error: rpcError } = await supabase.rpc('create_shared_calendar', {
        p_token: userToken.token,
        p_title: calendarDetails.title,
        p_description: calendarDetails.description,
        p_min_slot_duration: calendarDetails.minSlotDuration,
        p_start_date: calendarDetails.startDate,
        p_end_date: calendarDetails.endDate
      });
      
      if (rpcError) throw rpcError;
      return {
        message: 'Shared calendar created successfully',
        calendarId: data.calendar_id,
        inviteCode: data.invite_code
      };
    } catch (supabaseError) {
      throw new Error(`Failed to create calendar: ${supabaseError.message}`);
    }
  }
}

/**
 * Get calendar by ID
 * @param {string} calendarId - Calendar UUID
 * @returns {Promise} - Calendar details
 */
export async function getCalendarById(calendarId) {
  try {
    const response = await axios.get(`/api/calendar/${calendarId}`);
    return response.data;
  } catch (error) {
    console.error('API error, falling back to Supabase RPC:', error);
    // Fallback to direct Supabase RPC call
    try {
      const { data, error: rpcError } = await supabase.rpc('get_calendar', {
        p_calendar_id: calendarId
      });
      
      if (rpcError) throw rpcError;
      return data;
    } catch (supabaseError) {
      throw new Error(`Failed to get calendar: ${supabaseError.message}`);
    }
  }
}

/**
 * Join a calendar using invite code
 * @param {string} inviteCode - Calendar invite code
 * @param {Object} userToken - User's authentication token
 * @returns {Promise} - Result of join operation
 */
export async function joinCalendarByInvite(inviteCode, userToken) {
  try {
    const response = await axios.post('/api/calendar/join', {
      inviteCode,
      userToken
    });
    return response.data;
  } catch (error) {
    console.error('API error, falling back to Supabase RPC:', error);
    // Fallback to direct Supabase RPC call
    try {
      const { data, error: rpcError } = await supabase.rpc('join_calendar_by_invite', {
        p_invite_code: inviteCode,
        p_user_token: userToken.token
      });
      
      if (rpcError) throw rpcError;
      return data;
    } catch (supabaseError) {
      throw new Error(`Failed to join calendar: ${supabaseError.message}`);
    }
  }
}
