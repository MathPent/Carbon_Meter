const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Register user with role selection
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Validate inputs
    if (!firstName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      firstName,
      lastName: lastName || '',
      email,
      password,
      role,
    });

    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Google Login
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name } = payload;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        firstName: given_name || 'User',
        lastName: family_name || '',
        email,
        password: 'google_oauth_' + Date.now(), // dummy password for OAuth users
        role: 'Individual',
      });
      await user.save();
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id);

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
};
