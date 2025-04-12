const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an invitation email to a user
 * @param {string} to - Recipient email
 * @param {string} inviterName - Name of the person inviting
 * @param {string} calendarTitle - Title of the calendar
 * @param {string} inviteUrl - URL with invitation token
 * @returns {Promise} - SendGrid API response
 */
const sendInvitationEmail = async (to, inviterName, calendarTitle, inviteUrl) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@openhour.app', // Use the verified sender email
    subject: `${inviterName} invited you to collaborate on "${calendarTitle}"`,
    text: `
Hello,

${inviterName} has invited you to collaborate on a shared calendar "${calendarTitle}" in OpenHour.

To accept this invitation and view the shared calendar, please click the link below:
${inviteUrl}

If you don't have an OpenHour account yet, you'll be guided through the process of creating one.

Thank you,
The OpenHour Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
    .button { display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Calendar Invitation</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p><strong>${inviterName}</strong> has invited you to collaborate on a shared calendar "<strong>${calendarTitle}</strong>" in OpenHour.</p>
      <p>To accept this invitation and view the shared calendar, please click the button below:</p>
      <p style="text-align: center;">
        <a href="${inviteUrl}" class="button">View Shared Calendar</a>
      </p>
      <p>If you don't have an OpenHour account yet, you'll be guided through the process of creating one.</p>
    </div>
    <div class="footer">
      <p>Thank you,<br>The OpenHour Team</p>
      <p>If you didn't request this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  try {
    const response = await sgMail.send(msg);
    return response;
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error body:', error.response.body);
    }
    throw error;
  }
};

module.exports = {
  sendInvitationEmail
};
