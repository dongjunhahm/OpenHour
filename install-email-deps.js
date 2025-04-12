console.log("Installing email dependencies...");
console.log("Run: npm install @sendgrid/mail nodemailer --save");
console.log(
  "After installing, update your .env.local file with SendGrid settings:"
);
console.log(`
# SendGrid Configuration (recommended for production)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender@yourdomain.com
`);
