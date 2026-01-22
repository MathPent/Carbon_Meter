const nodemailer = require('nodemailer');

/**
 * Generate a random 6-digit OTP
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email using Nodemailer and Gmail
 * Requires: EMAIL and EMAIL_PASS in .env
 * EMAIL_PASS should be Gmail App Password (not regular password)
 * 
 * @param {string} email - Recipient email address
 * @param {string} otp - The 6-digit OTP
 * @param {string} purpose - 'Registration' or 'Password Reset' (default: 'Registration')
 */
const sendOtpEmail = async (email, otp, purpose = 'Registration') => {
  try {
    console.log(`\n📧 [sendOtpEmail] Starting email send for: ${email}, Purpose: ${purpose}`);
    
    if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
      console.error('❌ [sendOtpEmail] Missing EMAIL or EMAIL_PASS in environment variables');
      throw new Error('Email service not configured. Check .env file for EMAIL and EMAIL_PASS');
    }
    
    console.log(`📧 [sendOtpEmail] Using email: ${process.env.EMAIL}`);
    
    // Create Nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL, // Your Gmail email
        pass: process.env.EMAIL_PASS, // Gmail App Password (generate from Google Account)
      },
    });

    console.log(`✅ [sendOtpEmail] Transporter created successfully`);
    
    // Verify transporter connection (async version with promises)
    try {
      await transporter.verify();
      console.log('✅ [sendOtpEmail] SMTP connection verified');
    } catch (verifyError) {
      console.error('⚠️ [sendOtpEmail] SMTP connection warning (may still work):', verifyError.message);
    }

    // Generate dynamic subject and content based on purpose
    let subject, mainMessage, warning;
    
    if (purpose === 'Password Reset') {
      subject = '🔐 Your CarbonMeter Password Reset Code';
      mainMessage = `
        You requested to reset your password for your CarbonMeter account. 
        To proceed with the password reset, please use the OTP below:
      `;
      warning = `
        If you didn't request a password reset, please ignore this email and 
        your password will remain unchanged. Your account may be at risk if you 
        didn't make this request.
      `;
    } else {
      subject = '🔐 Your CarbonMeter OTP Verification Code';
      mainMessage = `
        Thank you for registering with <strong>CarbonMeter</strong>! 
        To complete your registration and verify your email address, please use the OTP below:
      `;
      warning = `
        If you didn't request this verification, please ignore this email.
      `;
    }

    // HTML template for OTP email
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4fff3;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              color: #193827;
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #193827;
              margin-bottom: 10px;
            }
            .content {
              color: #333;
              line-height: 1.6;
            }
            .otp-box {
              background-color: #f1f0e3;
              border-left: 4px solid #193827;
              padding: 20px;
              margin: 25px 0;
              text-align: center;
              border-radius: 4px;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #193827;
              letter-spacing: 5px;
              font-family: 'Courier New', monospace;
            }
            .expiry {
              color: #947534;
              font-size: 14px;
              margin-top: 15px;
              font-style: italic;
            }
            .footer {
              color: #666;
              font-size: 12px;
              text-align: center;
              margin-top: 30px;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            .warning {
              color: #d9534f;
              font-size: 13px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌍 CarbonMeter</div>
              <p style="color: #666; margin: 5px 0;">Track Your Carbon Footprint</p>
            </div>

            <div class="content">
              <p>Hello,</p>
              <p>${mainMessage}</p>

              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p class="expiry">⏱️ This OTP will expire in 5 minutes</p>
              </div>

              <p>
                <strong>Important:</strong>
              </p>
              <ul>
                <li>Do not share this OTP with anyone</li>
                <li>CarbonMeter support will never ask for your OTP</li>
                <li>${warning}</li>
              </ul>

              ${purpose === 'Registration' ? `
              <p>
                Once you verify your email, you can start tracking your carbon footprint and 
                join our community of climate-conscious individuals!
              </p>
              ` : `
              <p>
                After verifying this OTP, you'll be able to create a new password for your account.
              </p>
              `}

              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The CarbonMeter Team</strong>
              </p>

              <div class="warning">
                ⚠️ Security Note: This is an automated email. Please do not reply directly.
              </div>
            </div>

            <div class="footer">
              <p>
                © 2026 CarbonMeter. All rights reserved.<br>
                Made with ❤️ for a sustainable future
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: `"CarbonMeter" <${process.env.EMAIL}>`,
      to: email,
      subject: subject,
      html: htmlTemplate,
    };

    console.log(`📨 Sending email to: ${email}`);
    console.log(`📨 From: ${process.env.EMAIL}`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ ${purpose} OTP sent successfully to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Response: ${info.response}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

module.exports = {
  generateOtp,
  sendOtpEmail,
};
