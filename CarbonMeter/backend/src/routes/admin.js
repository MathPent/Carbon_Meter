/**
 * Admin Routes
 * 
 * Handles admin authentication and dashboard data
 * Completely isolated from user authentication
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Activity = require('../models/Activity');
const ChatMessage = require('../models/ChatMessage');
const { isAdminAuth, isSuperAdmin } = require('../middleware/adminAuth');
const router = express.Router();

// Rate limiting constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/admin/login
 * 
 * Admin login endpoint
 * Uses separate credentials from user login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });

    if (!admin) {
      console.log('❌ [Admin] Username not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      console.log('🔒 [Admin] Account locked:', username);
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked. Try again later.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      // Increment login attempts
      admin.loginAttempts += 1;

      if (admin.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        admin.lockUntil = Date.now() + LOCK_TIME;
        console.log('🔒 [Admin] Account locked due to failed attempts:', username);
      }

      await admin.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    admin.loginAttempts = 0;
    admin.lockUntil = null;
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id,
        username: admin.username,
        role: admin.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    console.log('✅ [Admin] Login successful:', username);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        username: admin.username,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ [Admin] Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

/**
 * GET /api/admin/dashboard/stats
 * 
 * Get platform overview statistics
 * Protected route - requires admin authentication
 */
router.get('/dashboard/stats', isAdminAuth, async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get users by role
    const individualCount = await User.countDocuments({ role: 'Individual' });
    const ngoCount = await User.countDocuments({ role: 'NGO' });
    const governmentCount = await User.countDocuments({ role: 'Government' });

    // Get active users (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ 
      updatedAt: { $gte: oneDayAgo } 
    });

    // Get total emissions
    const totalEmissions = await Activity.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$carbonFootprint' }
        }
      }
    ]);

    // Get today's emissions
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todayEmissions = await Activity.aggregate([
      {
        $match: {
          date: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$carbonFootprint' }
        }
      }
    ]);

    // Get monthly trend
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyEmissions = await Activity.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          total: { $sum: '$carbonFootprint' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get chat stats
    const totalChats = await ChatMessage.countDocuments();
    const todayChats = await ChatMessage.countDocuments({
      timestamp: { $gte: startOfToday }
    });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active24h: activeUsers,
          individual: individualCount,
          ngo: ngoCount,
          government: governmentCount
        },
        emissions: {
          total: totalEmissions[0]?.total || 0,
          today: todayEmissions[0]?.total || 0,
          monthlyTrend: monthlyEmissions
        },
        chatbot: {
          totalConversations: totalChats,
          todayQueries: todayChats
        }
      }
    });

  } catch (error) {
    console.error('❌ [Admin] Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * GET /api/admin/users
 * 
 * Get all users with filters
 * Protected route - requires admin authentication
 */
router.get('/users', isAdminAuth, async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;

    const query = {};
    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ [Admin] Users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/admin/emissions
 * 
 * Get emissions data by category
 * Protected route - requires admin authentication
 */
router.get('/emissions', isAdminAuth, async (req, res) => {
  try {
    const { category, timeframe = '30' } = req.query;

    const daysAgo = new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000);

    const query = { date: { $gte: daysAgo } };
    if (category) {
      query.category = category;
    }

    const emissions = await Activity.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ date: -1 })
      .limit(100);

    // Get breakdown by category
    const breakdown = await Activity.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$carbonFootprint' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      emissions,
      breakdown
    });

  } catch (error) {
    console.error('❌ [Admin] Emissions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emissions'
    });
  }
});

module.exports = router;
