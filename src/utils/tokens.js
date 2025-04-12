const crypto = require('crypto');

/**
 * Generate a secure random token for calendar invitations
 * @returns {string} A random token
 */
const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateInviteToken
};
