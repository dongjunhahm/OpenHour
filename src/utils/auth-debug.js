/**
 * Utility functions for debugging authentication issues
 */

import axios from 'axios';

/**
 * Check if a token is valid and exists in the database
 * @param {string} token - The token to check
 * @param {string} email - Optional email to check against
 * @returns {Promise<Object>} - Result of the token check
 */
export const checkToken = async (token, email = null) => {
  try {
    let url = `/api/debug/check-token?token=${encodeURIComponent(token)}`;
    
    if (email) {
      url += `&email=${encodeURIComponent(email)}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Token check failed:', error);
    return {
      error: true,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    };
  }
};

/**
 * Add a manual check function to the window object for debugging in browser console
 */
if (typeof window !== 'undefined') {
  window.debugAuthToken = async (email) => {
    const reduxState = window.__REDUX_DEVTOOLS_EXTENSION__ ? 
      window.__REDUX_DEVTOOLS_EXTENSION__.getState() : 
      { state: { token: { token: 'Redux DevTools not available' } } };
    
    const token = reduxState.state?.token?.token;
    
    console.log('Current token in Redux:', token ? token.substring(0, 6) + '...' : 'No token');
    
    if (!token) {
      console.log('No token found in Redux store');
      return;
    }
    
    if (email) {
      console.log(`Checking token against user with email: ${email}`);
      const result = await checkToken(token, email);
      console.log('Token check result:', result);
      return result;
    } else {
      console.log('Checking if token exists in database');
      const result = await checkToken(token);
      console.log('Token check result:', result);
      return result;
    }
  };
  
  console.log('Auth debugging utility added. Use window.debugAuthToken(email) in console to test token.');
}
