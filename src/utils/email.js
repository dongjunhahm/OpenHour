// Email utility functions using SendGrid
const crypto = require('crypto');

// Generate a secure invite token
function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send invitation email using SendGrid
async function sendInvitationEmail(recipientEmail, inviterName, calendarTitle, inviteLink) {
  // This is just a placeholder until you add your SendGrid API key
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    throw new Error('Email service not configured');
  }

  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const message = {
      to: recipientEmail,
      from: process.env.FROM_EMAIL || 'no-reply@openhour.app', // Use a verified sender in SendGrid
      subject: `${inviterName} invited you to a shared calendar`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to a shared calendar</h2>
          <p>${inviterName} has invited you to collaborate on the calendar: <strong>${calendarTitle}</strong></p>
          <p>Click the button below to accept the invitation and join the shared calendar:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${inviteLink}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #777; font-size: 12px;">
            This is an automated message from OpenHour. If you didn't expect this invitation, you can safely ignore it.
          </p>
        </div>
      `,
    };

    await sgMail.send(message);
    console.log(`Invitation email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
}

module.exports = {
  generateInviteToken,
  sendInvitationEmail,
};
