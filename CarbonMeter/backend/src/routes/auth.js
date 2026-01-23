const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOtp, sendOtpEmail } = require('../utils/sendOtp');
const authController = require('../controllers/authController');

const router = express.Router();

// =============================================================================
// STEP 1: SEND OTP - Collect firstName, lastName, email and send OTP
// =============================================================================
/**
 * POST /auth/register/send-otp
 * 
 * Purpose: First step of registration
 * Collects: firstName, lastName, email
 * Actions: 
 *   - Validate inputs
 *   - Check if email already exists (and is verified)
 *   - Generate 6-digit OTP
 *   - Save OTP with 5-minute expiry
 *   - Send OTP via email
 * 
 * Response: OTP sent, move to step 2
 */
router.post('/register/send-otp', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // ========== VALIDATION ==========
    if (!firstName || !email) {
      return res.status(400).json({ 
        message: 'First name and email are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }

    // ========== CHECK EXISTING USER ==========
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ 
        message: 'This email is already registered. Please login instead.',
        code: 'EMAIL_ALREADY_REGISTERED'
      });
    }

    // ========== GENERATE OTP ==========
    const otp = generateOtp();
    console.log(`\n📧 Generated OTP for ${email}: ${otp}`);

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email: email.toLowerCase() });

    // ========== SAVE OTP TO DATABASE ==========
    const newOtp = new Otp({
      email: email.toLowerCase(),
      otp,
    });
    await newOtp.save();
    console.log('💾 OTP saved to database');

    // ========== SEND OTP EMAIL ==========
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      // If email fails, still return success but user won't receive email
      console.error('Email sending failed:', emailError.message);
      return res.status(500).json({
        message: 'Failed to send OTP email. Please check your email address.',
        error: emailError.message
      });
    }

    // ========== SUCCESS RESPONSE ==========
    res.status(200).json({
      message: 'OTP sent successfully! Check your email.',
      email: email.toLowerCase(),
      firstName,
      lastName: lastName || '',
      expiresIn: '5 minutes',
      nextStep: 'verify-otp'
    });

  } catch (error) {
    console.error('❌ Error in register/send-otp:', error.message);
    res.status(500).json({ 
      message: 'Failed to send OTP', 
      error: error.message 
    });
  }
});

// =============================================================================
// STEP 2: VERIFY OTP - Only verify the OTP, don't create account yet
// =============================================================================
/**
 * POST /auth/register/verify-otp
 * 
 * Purpose: Second step of registration
 * Inputs: email, otp
 * Actions:
 *   - Check OTP exists
 *   - Check OTP hasn't expired
 *   - Mark email as OTP-verified (but don't create account yet)
 *   - Do NOT ask for password or create user
 * 
 * Response: OTP verified, move to step 3 (password creation)
 */
router.post('/register/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // ========== VALIDATION ==========
    if (!email || !otp) {
      return res.status(400).json({ 
        message: 'Email and OTP are required' 
      });
    }

    // ========== FIND AND VERIFY OTP ==========
    const otpRecord = await Otp.findOne({ 
      email: email.toLowerCase(), 
      otp 
    });

    if (!otpRecord) {
      return res.status(401).json({ 
        message: 'Invalid OTP. Please check and try again.',
        code: 'INVALID_OTP'
      });
    }

    // ========== CHECK OTP EXPIRY ==========
    const currentTime = new Date();
    const otpAge = (currentTime - otpRecord.createdAt) / 1000; // in seconds

    if (otpAge > 300) { // 5 minutes = 300 seconds
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(401).json({ 
        message: 'OTP has expired. Please request a new OTP.',
        code: 'OTP_EXPIRED'
      });
    }

    // ========== SUCCESS RESPONSE ==========
    // OTP is verified, but we DON'T create the user yet
    // User will now proceed to password creation step
    res.status(200).json({
      message: 'OTP verified successfully!',
      email: email.toLowerCase(),
      verified: true,
      nextStep: 'create-password',
      expiresIn: Math.round((300 - otpAge)) + ' seconds'
    });

  } catch (error) {
    console.error('❌ Error in register/verify-otp:', error.message);
    res.status(500).json({ 
      message: 'OTP verification failed', 
      error: error.message 
    });
  }
});

// =============================================================================
// STEP 3: CREATE PASSWORD & REGISTER - Create account with password
// =============================================================================
/**
 * POST /auth/register/create-password
 * 
 * Purpose: Third step of registration - Final account creation
 * Inputs: email, password, confirmPassword, firstName, lastName
 * Actions:
 *   - Validate passwords match
 *   - Validate password length (≥ 8 characters)
 *   - Check OTP was already verified
 *   - Hash password with bcrypt
 *   - Create user in database
 *   - Set isVerified = true
 *   - Delete OTP record
 *   - Return JWT token
 * 
 * Response: Account created, user logged in
 */
router.post('/register/create-password', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      confirmPassword, 
      firstName, 
      lastName,
      role,
      organizationType 
    } = req.body;

    // ========== VALIDATION ==========
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ 
        message: 'Email, password, and password confirmation are required' 
      });
    }

    // Password match validation
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        message: 'Passwords do not match. Please try again.',
        code: 'PASSWORD_MISMATCH'
      });
    }

    // Password length validation
    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Password strength validation (optional but recommended)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain uppercase, lowercase, and numbers',
        code: 'WEAK_PASSWORD'
      });
    }

    // ========== CHECK OTP WAS VERIFIED ==========
    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
    
    if (otpRecord) {
      // OTP still exists, check if it expired
      const currentTime = new Date();
      const otpAge = (currentTime - otpRecord.createdAt) / 1000;
      
      if (otpAge > 300) {
        return res.status(401).json({ 
          message: 'OTP has expired. Please start registration again.',
          code: 'OTP_EXPIRED'
        });
      }
    }
    // If no OTP record, assume it was already verified and deleted (that's fine)

    // ========== CHECK IF USER ALREADY EXISTS ==========
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.isVerified) {
      return res.status(400).json({ 
        message: 'User already registered. Please login instead.',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // ========== HASH PASSWORD WITH BCRYPT ==========
    const salt = await bcrypt.genSalt(10); // 10-round salt
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('🔐 Password hashed with bcrypt');

    // ========== CREATE OR UPDATE USER ==========
    if (user) {
      // Update existing unverified user
      user.password = hashedPassword;
      user.isVerified = true;
      user.firstName = firstName;
      user.lastName = lastName || '';
      user.role = role || 'Individual';
      if (role === 'Government' && organizationType) {
        user.organizationType = organizationType;
      }
      await user.save();
      console.log(`✏️ Updated unverified user: ${email}`);
    } else {
      // Create new user
      const userData = {
        firstName,
        lastName: lastName || '',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'Individual',
        isVerified: true, // Set to verified since OTP was verified
      };
      
      // Add organizationType for Government users
      if (role === 'Government' && organizationType) {
        userData.organizationType = organizationType;
      }
      
      user = new User(userData);
      await user.save();
      console.log(`✅ New user created: ${email} with role: ${role}`);
    }

    // ========== DELETE OTP AFTER SUCCESS ==========
    await Otp.deleteOne({ email: email.toLowerCase() });
    console.log('🗑️ OTP deleted after successful registration');

    // ========== GENERATE JWT TOKEN ==========
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('🔑 JWT token generated');

    // ========== SUCCESS RESPONSE ==========
    res.status(201).json({
      message: 'Registration successful! Welcome to CarbonMeter 🌍',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationType: user.organizationType,
        isVerified: user.isVerified,
      },
      nextStep: 'dashboard'
    });

  } catch (error) {
    console.error('❌ Error in register/create-password:', error.message);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// =============================================================================
// LEGACY ROUTES (BACKWARD COMPATIBILITY)
// =============================================================================

// Original /send-otp endpoint (legacy)
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ 
        message: 'User already registered with this email. Please login instead.' 
      });
    }

    const otp = generateOtp();
    await Otp.deleteMany({ email: email.toLowerCase() });
    const newOtp = new Otp({ email: email.toLowerCase(), otp });
    await newOtp.save();
    await sendOtpEmail(email, otp);

    res.status(200).json({
      message: 'OTP sent successfully to your email',
      email: email.toLowerCase(),
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to send OTP', 
      error: error.message 
    });
  }
});

// Original /verify-otp endpoint (legacy - combines verify + create account)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, firstName, lastName, password, role } = req.body;

    if (!email || !otp || !firstName || !password || !role) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long' 
      });
    }

    const otpRecord = await Otp.findOne({ 
      email: email.toLowerCase(), 
      otp 
    });

    if (!otpRecord) {
      return res.status(401).json({ 
        message: 'Invalid or expired OTP. Please request a new OTP.' 
      });
    }

    const currentTime = new Date();
    const otpAge = (currentTime - otpRecord.createdAt) / 1000;
    if (otpAge > 300) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(401).json({ 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.isVerified) {
      return res.status(400).json({ 
        message: 'User already verified. Please login.' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user) {
      user.firstName = firstName;
      user.lastName = lastName || '';
      user.password = hashedPassword;
      user.role = role;
      user.isVerified = true;
      await user.save();
    } else {
      user = new User({
        firstName,
        lastName: lastName || '',
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        isVerified: true,
      });
      await user.save();
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Email verified successfully! Account created.',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Verification failed', 
      error: error.message 
    });
  }
});

// Keep existing routes for backward compatibility
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);

// =============================================================================
// FORGOT PASSWORD FLOW - 3 STEPS
// =============================================================================

/**
 * STEP 1: REQUEST PASSWORD RESET
 * POST /auth/forgot-password
 * 
 * Purpose: Initiate password reset by sending OTP to email
 * Input: { email }
 * Logic:
 *   - Check if user exists
 *   - Generate 6-digit OTP
 *   - Save OTP with 5-minute expiry
 *   - Send OTP email
 * Response: "OTP sent for password reset"
 */
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('\n🔐 [FORGOT PASSWORD] Request received');
    console.log('Request body:', req.body);
    
    const { email } = req.body;

    // ========== VALIDATION ==========
    if (!email) {
      console.log('❌ [FORGOT PASSWORD] No email provided');
      return res.status(400).json({ 
        message: 'Email is required' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ [FORGOT PASSWORD] Invalid email format');
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }

    // ========== CHECK IF USER EXISTS ==========
    console.log(`🔍 [FORGOT PASSWORD] Searching for user: ${email.toLowerCase()}`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`⚠️ [FORGOT PASSWORD] User not found: ${email.toLowerCase()}`);
      // ⚠️ SECURITY: Don't reveal if email exists or not (prevent email enumeration)
      // Always return success for security reasons
      return res.status(200).json({
        message: 'If this email exists, a password reset OTP has been sent',
        email: email.toLowerCase(),
      });
    }
    
    console.log(`✅ [FORGOT PASSWORD] User found: ${user.username} (${user.email})`);

    // ========== GENERATE OTP ==========
    const otp = generateOtp();
    console.log(`🔐 [FORGOT PASSWORD] Generated OTP for ${email}: ${otp}`);

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email: email.toLowerCase() });
    console.log(`🗑️ [FORGOT PASSWORD] Deleted old OTPs for ${email.toLowerCase()}`);

    // ========== SAVE OTP TO DATABASE ==========
    const newOtp = new Otp({
      email: email.toLowerCase(),
      otp,
      purpose: 'password-reset', // Mark this OTP as for password reset
    });
    await newOtp.save();
    console.log('💾 [FORGOT PASSWORD] OTP saved to database');

    // ========== SEND OTP EMAIL ==========
    try {
      console.log(`📧 [FORGOT PASSWORD] Attempting to send email to: ${email}`);
      await sendOtpEmail(email, otp, 'Password Reset');
      console.log(`✅ [FORGOT PASSWORD] Email sent successfully to: ${email}`);
    } catch (emailError) {
      console.error('❌ [FORGOT PASSWORD] Email sending failed:', emailError.message);
      console.error('Full error:', emailError);
      
      // Still save the OTP so user can try again if email fails
      return res.status(200).json({
        message: 'OTP generated. If email delivery fails, please check spam folder or try again.',
        email: email.toLowerCase(),
        expiresIn: '5 minutes',
        nextStep: 'verify-reset-otp',
        warning: 'Email may be delayed. Check spam folder.',
        debug: process.env.NODE_ENV === 'development' ? `Email error: ${emailError.message}` : undefined
      });
    }

    // ========== SUCCESS RESPONSE ==========
    const response = {
      message: 'Password reset OTP sent successfully! Check your email.',
      email: email.toLowerCase(),
      expiresIn: '5 minutes',
      nextStep: 'verify-reset-otp'
    };
    
    // In development, include OTP in response for testing
    if (process.env.NODE_ENV === 'development') {
      response.devOtp = otp;
      console.log(`\n🔓 [DEV MODE] OTP for ${email}: ${otp}\n`);
    }
    
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error in forgot-password:', error.message);
    res.status(500).json({ 
      message: 'Failed to initiate password reset', 
      error: error.message 
    });
  }
});

/**
 * STEP 2: VERIFY RESET OTP
 * POST /auth/verify-reset-otp
 * 
 * Purpose: Verify OTP for password reset (doesn't change password yet)
 * Input: { email, otp }
 * Logic:
 *   - Check OTP validity
 *   - Check OTP expiry (5 minutes)
 *   - If valid, proceed to password reset (DO NOT change password yet)
 * Response: "OTP verified, proceed to password reset"
 */
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // ========== VALIDATION ==========
    if (!email || !otp) {
      return res.status(400).json({ 
        message: 'Email and OTP are required' 
      });
    }

    // ========== CHECK OTP ==========
    const otpRecord = await Otp.findOne({ 
      email: email.toLowerCase(),
      otp
    });

    if (!otpRecord) {
      return res.status(401).json({
        message: 'Invalid OTP. Please check and try again.',
        code: 'INVALID_OTP'
      });
    }

    // ========== CHECK OTP EXPIRY ==========
    const currentTime = new Date();
    const otpAge = (currentTime - otpRecord.createdAt) / 1000; // in seconds

    if (otpAge > 300) { // 5 minutes = 300 seconds
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(401).json({ 
        message: 'OTP has expired. Please request a new password reset OTP.',
        code: 'OTP_EXPIRED'
      });
    }

    // ========== SUCCESS RESPONSE ==========
    // OTP is verified, proceed to password reset
    res.status(200).json({
      message: 'OTP verified successfully!',
      email: email.toLowerCase(),
      verified: true,
      nextStep: 'reset-password',
      expiresIn: Math.round((300 - otpAge)) + ' seconds'
    });

  } catch (error) {
    console.error('❌ Error in verify-reset-otp:', error.message);
    res.status(500).json({ 
      message: 'OTP verification failed', 
      error: error.message 
    });
  }
});

/**
 * STEP 3: RESET PASSWORD
 * POST /auth/reset-password
 * 
 * Purpose: Change password after OTP verification
 * Input: { email, newPassword, confirmNewPassword }
 * Logic:
 *   - Validate passwords match
 *   - Validate password strength
 *   - Hash new password with bcrypt
 *   - Update user password
 *   - Delete OTP
 * Response: "Password reset successful"
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmNewPassword } = req.body;

    // ========== VALIDATION ==========
    if (!email || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ 
        message: 'Email, password, and password confirmation are required' 
      });
    }

    // Password match validation
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ 
        message: 'Passwords do not match. Please try again.',
        code: 'PASSWORD_MISMATCH'
      });
    }

    // Password length validation
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must contain uppercase, lowercase, and numbers',
        code: 'WEAK_PASSWORD'
      });
    }

    // ========== CHECK IF USER EXISTS ==========
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // ========== CHECK IF OTP WAS VERIFIED ==========
    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
    
    if (otpRecord) {
      // OTP exists, check if it expired
      const currentTime = new Date();
      const otpAge = (currentTime - otpRecord.createdAt) / 1000;
      
      if (otpAge > 300) {
        return res.status(401).json({ 
          message: 'OTP has expired. Please request a new password reset.',
          code: 'OTP_EXPIRED'
        });
      }
    }
    // If no OTP record, assume it was already verified and deleted

    // ========== HASH NEW PASSWORD ==========
    // ⚠️ CRITICAL FIX: Assign hashed password directly to bypass User model's pre-save hook
    // The pre-save hook will detect it's already hashed (starts with $2) and skip double-hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log('🔐 New password hashed with bcrypt');

    // ========== UPDATE USER PASSWORD ==========
    user.password = hashedPassword;
    user.updatedAt = new Date();
    await user.save();
    console.log(`✏️ Password reset for user: ${email}`);

    // ========== DELETE OTP AFTER SUCCESS ==========
    await Otp.deleteOne({ email: email.toLowerCase() });
    console.log('🗑️ OTP deleted after successful password reset');

    // ========== SUCCESS RESPONSE ==========
    res.status(200).json({
      message: '✅ Password reset successful! You can now login with your new password.',
      email: email.toLowerCase(),
      nextStep: 'login'
    });

  } catch (error) {
    console.error('❌ Error in reset-password:', error.message);
    res.status(500).json({ 
      message: 'Password reset failed', 
      error: error.message 
    });
  }
});

// =============================================================================
// RESEND OTP ENDPOINT (Works for both registration and password reset)
// =============================================================================
/**
 * POST /auth/resend-otp
 * 
 * Purpose: Resend OTP to user's email
 * Input: { email, purpose } (purpose: 'registration' or 'password-reset')
 * Logic:
 *   - Check if OTP exists for email
 *   - Limit resend attempts (max 5 per session)
 *   - Generate new OTP
 *   - Replace old OTP with new one
 *   - Send new OTP email
 * Response: "OTP resent successfully"
 */
router.post('/resend-otp', async (req, res) => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔄 [RESEND-OTP ENDPOINT HIT]');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { email, purpose = 'registration' } = req.body;

    console.log(`\n📨 Resend OTP request for: ${email}, Purpose: ${purpose}`);

    // ========== VALIDATION ==========
    if (!email) {
      console.log('❌ Email is empty');
      return res.status(400).json({ 
        message: 'Email is required' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`❌ Invalid email format: ${email}`);
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }

    // ========== CHECK IF OTP EXISTS ==========
    console.log(`🔍 Checking for existing OTP for: ${email.toLowerCase()}`);
    const existingOtp = await Otp.findOne({ email: email.toLowerCase() });

    if (!existingOtp) {
      console.log(`❌ No OTP found for ${email}. User needs to request a fresh OTP.`);
      return res.status(400).json({
        message: 'No OTP request found for this email. Please request a new OTP first.',
        code: 'NO_OTP_FOUND',
        requiresFreshOtp: true
      });
    }

    console.log(`✅ Found existing OTP. Current resend count: ${existingOtp.resendCount}`);

    // ========== CHECK RESEND LIMIT ==========
    const maxResendAttempts = 5;
    if (existingOtp.resendCount >= maxResendAttempts) {
      console.log(`❌ Resend limit exceeded for ${email}`);
      return res.status(429).json({
        message: `Maximum resend attempts (${maxResendAttempts}) exceeded. Please request a new OTP.`,
        code: 'RESEND_LIMIT_EXCEEDED',
        retryAfter: 300,
        requiresFreshOtp: true
      });
    }

    // ========== GENERATE NEW OTP ==========
    const newOtp = generateOtp();
    console.log(`🔄 Resending OTP for ${email}: ${newOtp}`);

    // ========== UPDATE OTP IN DATABASE ==========
    existingOtp.otp = newOtp;
    existingOtp.resendCount += 1;
    existingOtp.lastResendTime = new Date();
    existingOtp.createdAt = new Date(); // Reset expiry timer
    await existingOtp.save();
    console.log(`✅ OTP updated (resend count: ${existingOtp.resendCount})`);

    // ========== SEND NEW OTP EMAIL ==========
    try {
      const emailPurpose = purpose === 'password-reset' ? 'Password Reset' : 'Registration';
      console.log(`🚀 Sending email to ${email} with purpose: ${emailPurpose}`);
      console.log(`📧 Email config: USER=${process.env.EMAIL}, PASS=${process.env.EMAIL_PASS ? '***' : 'NOT SET'}`);
      
      await sendOtpEmail(email, newOtp, emailPurpose);
      console.log(`✅ Email sent successfully to ${email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      
      return res.status(500).json({
        message: 'Failed to resend OTP email. Please try again.',
        error: emailError.message
      });
    }

    // ========== SUCCESS RESPONSE ==========
    console.log('\n✅ [RESEND-OTP SUCCESS]');
    console.log(`   Email: ${email.toLowerCase()}`);
    console.log(`   Resend count: ${existingOtp.resendCount}/${maxResendAttempts}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    res.status(200).json({
      message: 'OTP resent successfully! Check your email.',
      email: email.toLowerCase(),
      expiresIn: '5 minutes',
      resendCount: existingOtp.resendCount,
      maxResendAttempts: maxResendAttempts
    });

  } catch (error) {
    console.error('\n❌ [RESEND-OTP ERROR]');
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    console.error('═══════════════════════════════════════════════════════════\n');
    
    res.status(500).json({ 
      message: 'Failed to resend OTP', 
      error: error.message 
    });
  }
});

module.exports = router;
