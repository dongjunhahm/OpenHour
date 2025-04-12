import nodemailer from 'nodemailer';

// Configure email transporter
// For development, you can use a testing service like Ethereal or Mailtrap
// For production, use your actual email service (Gmail, SendGrid, AWS SES, etc.)
const createTransporter = () => {
  // For development/testing, create a test account with Ethereal
  if (process.env.NODE_ENV !== 'production') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  
  // For production, use your actual email service
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} options.html - HTML email body
 * @returns {Promise} - Result of sending email
 */
export const sendEmail = async (options) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'OpenHour <noreply@openhour.app>',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    // For testing with Ethereal, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Generate HTML for calendar invitation email
 * @param {Object} data - Email data
 * @param {string} data.inviterName - Name of the person sending the invitation
 * @param {string} data.calendarTitle - Title of the shared calendar
 * @param {string} data.inviteLink - Link to accept the invitation
 * @returns {string} - HTML email content
 */
export const generateCalendarInviteHtml = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Calendar Invitation</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4338ca;
          padding: 20px;
          text-align: center;
          color: white;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border-radius: 0 0 5px 5px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .button {
          display: inline-block;
          background-color: #4338ca;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 5px;
          margin-top: 20px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OpenHour Calendar Invitation</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>${data.inviterName || 'Someone'} has invited you to collaborate on a shared calendar "${data.calendarTitle}" in OpenHour.</p>
          <p>OpenHour helps you find the best meeting times by analyzing everyone's availability.</p>
          <p>Click the button below to join this shared calendar:</p>
          <div style="text-align: center;">
            <a href="${data.inviteLink}" class="button">Accept Invitation</a>
          </div>
          <p style="margin-top: 30px;">If you're having trouble with the button above, copy and paste the following link into your browser:</p>
          <p style="word-break: break-all;">${data.inviteLink}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} OpenHour. All rights reserved.</p>
          <p>If you didn't request this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text for calendar invitation email
 * @param {Object} data - Email data
 * @param {string} data.inviterName - Name of the person sending the invitation
 * @param {string} data.calendarTitle - Title of the shared calendar
 * @param {string} data.inviteLink - Link to accept the invitation
 * @returns {string} - Plain text email content
 */
export const generateCalendarInviteText = (data) => {
  return `
OpenHour Calendar Invitation

Hello,

${data.inviterName || 'Someone'} has invited you to collaborate on a shared calendar "${data.calendarTitle}" in OpenHour.

OpenHour helps you find the best meeting times by analyzing everyone's availability.

To accept this invitation, visit:
${data.inviteLink}

If you didn't request this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} OpenHour. All rights reserved.
  `.trim();
};
