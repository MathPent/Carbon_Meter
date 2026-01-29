const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('[Auth] No token provided');
      return res.status(401).json({ 
        success: false,
        message: 'No authentication token provided' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth] Token verified for user:', decoded.id);
    
    // Find user (with error handling for DB issues)
    let user;
    try {
      user = await User.findById(decoded.id).select('-password');
    } catch (dbError) {
      console.error('[Auth] Database error finding user:', dbError.message);
      // Continue with decoded data if DB fails
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        _id: decoded.id
      };
      console.log('[Auth] Using token data (DB unavailable)');
      return next();
    }
    
    if (!user) {
      console.log('[Auth] User not found in database:', decoded.id);
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Attach user to request
    req.user = {
      id: user._id,
      _id: user._id, // Compatibility
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    
    req.token = token;
    
    next();
  } catch (error) {
    console.error('[Auth] Middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

module.exports = auth;
