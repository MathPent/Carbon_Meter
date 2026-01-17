const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOtp, sendOtpEmail } = require('../utils/sendOtp');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * POST /auth/send-otp
 * Step 1: User enters email → OTP is generated and sent
 * Validates:
 * - Email format
 * - User doesn't already exist
 * - Generates 6-digit OTP
 * - Saves OTP to DB (expires in 5 mins)
 * - Sends OTP via email
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ 
        message: 'User already registered with this email. Please login instead.' 
      });
    }

    // Generate OTP
    const otp = generateOtp();
    console.log(`📧 Generated OTP for ${email}: ${otp}`);

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Save OTP to database
    const newOtp = new Otp({
      email: email.toLowerCase(),
      otp,
    });
    await newOtp.save();
    console.log('💾 OTP saved to database');

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.status(200).json({
      message: 'OTP sent successfully to your email',
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Error in send-otp:', error.message);
    res.status(500).json({ 
      message: 'Failed to send OTP', 
      error: error.message 
    });
  }
});

/**
 * POST /auth/verify-otp
 * Step 2: User enters OTP → OTP is verified and user is created
 * Validates:
 * - OTP matches database
 * - OTP hasn't expired
 * - Password is strong
 * - Creates user with hashed password
 * - Deletes OTP after verification
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, firstName, lastName, password, role } = req.body;

    // Validate inputs
    if (!email || !otp || !firstName || !password || !role) {
      return res.status(400).json({ 
        message: 'Email, OTP, First Name, Password, and Role are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if OTP exists and matches
    const otpRecord = await Otp.findOne({ 
      email: email.toLowerCase(), 
      otp 
    });

    if (!otpRecord) {
      return res.status(401).json({ 
        message: 'Invalid or expired OTP. Please request a new OTP.' 
      });
    }

    // Check if OTP has expired (MongoDB TTL handles this, but extra check)
    const currentTime = new Date();
    const otpAge = (currentTime - otpRecord.createdAt) / 1000; // in seconds
    if (otpAge > 300) { // 5 minutes
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(401).json({ 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    // Check if user already exists (unverified user trying to re-register)
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.isVerified) {
      return res.status(400).json({ 
        message: 'User already verified. Please login.' 
      });
    }

    // Hash password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create or update user
    if (user) {
      // Update unverified user
      user.firstName = firstName;
      user.lastName = lastName || '';
      user.password = hashedPassword;
      user.role = role;
      user.isVerified = true;
      await user.save();
    } else {
      // Create new user
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

    // Delete OTP after successful verification
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log(`✅ User ${email} verified successfully`);

    // Generate JWT token
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
    console.error('Error in verify-otp:', error.message);
    res.status(500).json({ 
      message: 'Verification failed', 
      error: error.message 
    });
  }
});

// Existing routes (kept for backward compatibility)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);

module.exports = router;
