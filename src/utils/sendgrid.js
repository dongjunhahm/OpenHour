import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_APIKEY || '');

// Check if SendGrid is configured
const isSendGridConfigured = () => {
  return !!process.env.SENDGRID_APIKEY;
};

/**
 * Send an invitation email to a user
 * @param {string} to - Recipient email
 * @param {string} inviterName - Name of the person inviting
 * @param {string} calendarTitle - Title of the calendar
 * @param {string} inviteUrl - URL with invitation token
 * @returns {Promise} - SendGrid API response
 */
const sendInvitationEmail = async (to, inviterName, calendarTitle, inviteUrl) => {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@openhour.app';
  console.log(`Using from email: ${fromEmail}`);
  
  const msg = {
    to,
    from: fromEmail,
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
    // Check if SendGrid is configured
    if (isSendGridConfigured()) {
      console.log('Using SendGrid for email delivery');
      // Send using SendGrid
      const response = await sgMail.send(msg);
      console.log('Email sent successfully using SendGrid');
      return { status: 'Sent', mailSent: true };
    } else {
      console.log('SendGrid not configured, attempting to use Nodemailer');
      // Try to use Nodemailer with configured email settings
      // Import nodemailer dynamically to avoid issues if it's not installed
      try {
        // Use dynamic import for nodemailer
        const nodemailerModule = await import('nodemailer');
        const nodemailer = nodemailerModule.default;
        
        let transporter;
        
        // Check if we have email credentials
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          // Use configured credentials
          transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });
          
          console.log(`Nodemailer config: SMTP ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
        } else {
          // Create a test account on ethereal.email for testing
          console.log('No email credentials found, creating test account on ethereal.email...');
          const testAccount = await nodemailer.createTestAccount();
          
          // Create a transporter using the test account
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          
          console.log('Created test email account:', testAccount.user);
        }
        
        // Send the email
        const info = await transporter.sendMail(msg);
        console.log('Email sent successfully using Nodemailer');
        
        // If this is an Ethereal test account, show the preview URL
        if (info && nodemailer.getTestMessageUrl) {
          const previewUrl = nodemailer.getTestMessageUrl(info);
          console.log('Preview URL:', previewUrl);
          return { 
            status: 'Sent via Nodemailer', 
            mailSent: true, 
            info,
            previewUrl 
          };
        }
        
        return { status: 'Sent via Nodemailer', mailSent: true, info };
      } catch (nodemailerError) {
        console.error('Nodemailer Error:', nodemailerError);
        console.warn('Unable to send invitation email: Email service not properly configured');
        // Just log the error but don't throw so the invitation process can continue
        return { status: 'Email service not configured', mailSent: false };
      }
    }
  } catch (error) {
    console.error('Email Service Error:', error);
    if (error.response) {
      console.error('Error details:', error.response.body);
    }
    // Log the error but don't throw so the invitation process can continue
    return { status: 'Email sending failed', mailSent: false, error: error.message };
  }
};

export {
  sendInvitationEmail,
  isSendGridConfigured
};
