/**
 * Quick test script to verify Gmail SMTP configuration
 * Run: node test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n==========================================');
console.log('📧 Gmail SMTP Configuration Test');
console.log('==========================================\n');

// Check environment variables
console.log('1️⃣ Checking environment variables...');
console.log('   EMAIL:', process.env.EMAIL ? '✅ SET' : '❌ MISSING');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ MISSING');

if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
  console.error('\n❌ Missing email configuration!');
  process.exit(1);
}

// Create transporter
console.log('\n2️⃣ Creating Nodemailer transporter...');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('   ✅ Transporter created');

// Verify connection
console.log('\n3️⃣ Verifying SMTP connection...');
transporter.verify((error, success) => {
  if (error) {
    console.error('   ❌ SMTP verification failed:', error.message);
    console.error('   Error details:', error);
    process.exit(1);
  } else {
    console.log('   ✅ SMTP connection verified successfully!');
    
    // Send test email
    console.log('\n4️⃣ Sending test email...');
    
    const testEmail = process.env.EMAIL; // Send to ourselves
    const mailOptions = {
      from: `"CarbonMeter Test" <${process.env.EMAIL}>`,
      to: testEmail,
      subject: '🧪 CarbonMeter - SMTP Test',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4fff3; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
              .header { color: #193827; text-align: center; margin-bottom: 30px; }
              .content { color: #333; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🧪 SMTP Configuration Test</h1>
              </div>
              <div class="content">
                <p>Hi,</p>
                <p>This is a test email to verify that your Gmail SMTP configuration is working correctly.</p>
                
                <p><strong>Configuration Details:</strong></p>
                <ul>
                  <li>Service: Gmail SMTP</li>
                  <li>Email: ${process.env.EMAIL}</li>
                  <li>Status: ✅ Connected Successfully</li>
                </ul>

                <p>If you received this email, your OTP email configuration is working!</p>

                <p>Best regards,<br><strong>CarbonMeter Team</strong></p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('   ❌ Email sending failed:', error.message);
        console.error('   Error details:', error);
        process.exit(1);
      } else {
        console.log('   ✅ Test email sent successfully!');
        console.log('   Response:', info.response);
        
        console.log('\n==========================================');
        console.log('✅ All tests passed! Gmail SMTP is working.');
        console.log('==========================================\n');
        process.exit(0);
      }
    });
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n❌ Test timed out after 10 seconds');
  process.exit(1);
}, 10000);
