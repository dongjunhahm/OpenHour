import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Secret key for token signing - ideally this should be in environment variables
const TOKEN_SECRET = process.env.JWT_SECRET || 'calendar-invite-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d'; // 7 days for invitation tokens

/**
 * Generate a unique invitation token for calendar invites
 * @param {Object} payload - Data to include in the token
 * @param {number} payload.calendarId - ID of the calendar
 * @param {string} payload.email - Email of the invited user
 * @param {number} [payload.inviterId] - ID of the user sending the invite
 * @returns {string} - JWT token
 */
export const generateInviteToken = (payload) => {
  if (!payload.calendarId || !payload.email) {
    throw new Error('calendarId and email are required for generating invitation tokens');
  }
  
  // Add a unique ID to the token
  const tokenId = uuidv4();
  
  return jwt.sign(
    { ...payload, tokenId },
    TOKEN_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

/**
 * Verify and decode an invitation token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export const verifyInviteToken = (token) => {
  try {
    return jwt.verify(token, TOKEN_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Generate a full invitation URL
 * @param {Object} payload - Data to include in the token
 * @param {number} payload.calendarId - ID of the calendar
 * @param {string} payload.email - Email of the invited user
 * @param {number} [payload.inviterId] - ID of the user sending the invite
 * @returns {string} - Full invitation URL
 */
export const generateInviteUrl = (payload) => {
  const token = generateInviteToken(payload);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/invite/accept?token=${encodeURIComponent(token)}`;
};
