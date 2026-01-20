const express = require('express');
const jwt = require('jsonwebtoken');
const Activity = require('../models/Activity');
const User = require('../models/User');

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded; // Contains userId
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const router = express.Router();

// Log manual activity with complete data
router.post('/log-manual', authMiddleware, async (req, res) => {
  try {
    const { category, logType, description, carbonEmission, data, formula, source } = req.body;
    // Extract userId from JWT token (JWT payload has 'id' property)
    const userId = req.user.id;

    // Prepare activity document based on category
    const activityData = {
      userId,
      category,
      logType: logType || 'manual',
      description,
      carbonEmission,
      formula,
      source,
    };

    // Add category-specific data
    switch (category) {
      case 'Transport':
        activityData.transportData = data;
        break;
      case 'Electricity':
        activityData.electricityData = data;
        break;
      case 'Food':
        activityData.foodData = data;
        break;
      case 'Waste':
        activityData.wasteData = data;
        break;
    }

    const activity = new Activity(activityData);
    await activity.save();

    res.status(201).json({ 
      success: true, 
      message: 'Activity logged successfully',
      activity 
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error logging activity', 
      error: error.message 
    });
  }
});

// Get user statistics (total, daily, monthly emissions)
router.get('/user-stats', authMiddleware, async (req, res) => {
  try {
    // Extract userId from JWT token (JWT payload has 'id' property)
    const userId = req.user.id;
    
    // Get all activities for user
    const activities = await Activity.find({ userId });
    
    // Calculate total emissions
    const totalEmissions = activities.reduce((sum, activity) => sum + activity.carbonEmission, 0);
    
    // Calculate today's emissions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayActivities = activities.filter(activity => 
      new Date(activity.date) >= today
    );
    const dailyEmissions = todayActivities.reduce((sum, activity) => sum + activity.carbonEmission, 0);
    
    // Calculate this month's emissions
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthActivities = activities.filter(activity => 
      new Date(activity.date) >= firstDayOfMonth
    );
    const monthlyEmissions = monthActivities.reduce((sum, activity) => sum + activity.carbonEmission, 0);
    
    // Category breakdown
    const categoryBreakdown = {
      Transport: 0,
      Electricity: 0,
      Food: 0,
      Waste: 0,
    };
    
    activities.forEach(activity => {
      categoryBreakdown[activity.category] = 
        (categoryBreakdown[activity.category] || 0) + activity.carbonEmission;
    });
    
    // Recent activities (last 5)
    const recentActivities = activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(activity => ({
        id: activity._id,
        category: activity.category,
        description: activity.description,
        carbonEmission: activity.carbonEmission,
        date: activity.date,
      }));

    res.json({
      success: true,
      stats: {
        totalEmissions: Math.round(totalEmissions * 100) / 100,
        dailyEmissions: Math.round(dailyEmissions * 100) / 100,
        monthlyEmissions: Math.round(monthlyEmissions * 100) / 100,
        totalActivities: activities.length,
        categoryBreakdown,
        recentActivities,
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching statistics', 
      error: error.message 
    });
  }
});

// Get user activity history with pagination
router.get('/history', authMiddleware, async (req, res) => {
  try {
    // Extract userId from JWT token (JWT payload has 'id' property)
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category; // Optional filter

    const query = { userId };
    if (category) {
      query.category = category;
    }

    const activities = await Activity.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Activity.countDocuments(query);

    res.json({
      success: true,
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching activities', 
      error: error.message 
    });
  }
});

// Get leaderboard (top users by emissions saved)
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const period = req.query.period || 'all'; // all, monthly, weekly
    
    let dateFilter = {};
    if (period === 'monthly') {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      dateFilter = { date: { $gte: firstDayOfMonth } };
    } else if (period === 'weekly') {
      const firstDayOfWeek = new Date();
      firstDayOfWeek.setDate(firstDayOfWeek.getDate() - 7);
      firstDayOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { date: { $gte: firstDayOfWeek } };
    }

    // Aggregate emissions by user
    const leaderboard = await Activity.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$userId',
          totalEmissions: { $sum: '$carbonEmission' },
          activitiesCount: { $sum: 1 },
        }
      },
      { $sort: { totalEmissions: 1 } }, // Lower emissions = better rank
      { $limit: 50 },
    ]);

    // Populate user details
    const leaderboardWithUsers = await Promise.all(
      leaderboard.map(async (entry, index) => {
        const user = await User.findById(entry._id).select('username email');
        return {
          rank: index + 1,
          userId: entry._id,
          username: user?.username || 'Anonymous',
          totalEmissions: Math.round(entry.totalEmissions * 100) / 100,
          activitiesCount: entry.activitiesCount,
        };
      })
    );

    res.json({
      success: true,
      leaderboard: leaderboardWithUsers,
      period,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching leaderboard', 
      error: error.message 
    });
  }
});

module.exports = router;
