/**
 * Admin Authentication Middleware
 * 
 * Protects admin routes by verifying JWT token contains adminId
 * Rejects regular user tokens and unauthorized requests
 */

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to verify admin authentication
 * Checks for adminToken in Authorization header
 * Verifies JWT contains adminId (not userId)
 * Rejects locked accounts
 */
const isAdminAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. Admin authentication required.' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token contains adminId (not userId)
    if (!decoded.adminId) {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    // Fetch admin from database
    const admin = await Admin.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      return res.status(404).json({ 
        error: 'Admin account not found.' 
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({ 
        error: 'Account is locked due to multiple failed login attempts.',
        lockUntil: admin.lockUntil
      });
    }

    // Attach admin to request object
    req.admin = admin;
    
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }

    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error.' });
  }
};

/**
 * Middleware to verify super admin role
 * Use for critical operations like deleting users, modifying system settings
 */
const isSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ 
      error: 'Access denied. Super admin privileges required.' 
    });
  }
  next();
};

module.exports = { isAdminAuth, isSuperAdmin };
