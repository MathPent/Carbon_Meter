const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT and check government role
const verifyGovUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'Government') {
      return res.status(403).json({ message: 'Access denied. Government role required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/gov/dashboard - Dashboard data
router.get('/dashboard', verifyGovUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    // KPIs
    const todayEmission = await Activity.aggregate([
      { $match: { userId, date: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$carbonEmission' } } },
    ]);

    const monthlyEmission = await Activity.aggregate([
      { $match: { userId, date: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: '$carbonEmission' } } },
    ]);

    const yearlyEmission = await Activity.aggregate([
      { $match: { userId, date: { $gte: firstDayOfYear } } },
      { $group: { _id: null, total: { $sum: '$carbonEmission' } } },
    ]);

    const topActivity = await Activity.aggregate([
      { $match: { userId, date: { $gte: firstDayOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$carbonEmission' } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    // Daily emissions for last 30 days
    const dailyEmissions = await Activity.aggregate([
      { $match: { userId, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          emission: { $sum: '$carbonEmission' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', emission: 1, _id: 0 } },
    ]);

    // Category breakdown
    const categoryBreakdown = await Activity.aggregate([
      { $match: { userId, date: { $gte: firstDayOfMonth } } },
      {
        $group: {
          _id: '$category',
          value: { $sum: '$carbonEmission' },
        },
      },
      { $project: { name: '$_id', value: 1, _id: 0 } },
    ]);

    // Weekly trend (last 4 weeks)
    const weeklyTrend = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekEmission = await Activity.aggregate([
        { $match: { userId, date: { $gte: weekStart, $lt: weekEnd } } },
        { $group: { _id: null, total: { $sum: '$carbonEmission' } } },
      ]);

      weeklyTrend.push({
        week: `Week ${4 - i}`,
        emission: weekEmission[0]?.total || 0,
      });
    }

    // Recent activities
    const recentActivities = await Activity.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .select('category description carbonEmission date');

    res.json({
      kpis: {
        todayEmission: todayEmission[0]?.total || 0,
        monthlyEmission: monthlyEmission[0]?.total || 0,
        yearlyEmission: yearlyEmission[0]?.total || 0,
        topActivity: topActivity[0]?._id || 'N/A',
      },
      dailyEmissions,
      categoryBreakdown,
      weeklyTrend,
      recentActivities,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/gov/log-activity - Log government activity
router.post('/log-activity', verifyGovUser, async (req, res) => {
  try {
    const {
      organizationType,
      activityType,
      category,
      carbonEmission,
      description,
      metadata,
      formula,
      source,
    } = req.body;

    const activity = new Activity({
      userId: req.user._id,
      category,
      description,
      carbonEmission,
      logType: 'manual',
      formula,
      source,
      date: new Date(),
    });

    // Store government-specific metadata
    activity.metadata = {
      role: 'Government',
      organizationType,
      activityType,
      ...metadata,
    };

    await activity.save();

    res.status(201).json({
      message: 'Activity logged successfully',
      activity,
    });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/gov/analytics - Analytics data
router.get('/analytics', verifyGovUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Monthly trend
    const monthlyTrend = await Activity.aggregate([
      { $match: { userId, date: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          emission: { $sum: '$carbonEmission' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', emission: 1, _id: 0 } },
    ]);

    // Category breakdown
    const categoryBreakdown = await Activity.aggregate([
      { $match: { userId, date: { $gte: startDate } } },
      {
        $group: {
          _id: '$category',
          value: { $sum: '$carbonEmission' },
        },
      },
      { $project: { name: '$_id', value: 1, _id: 0 } },
    ]);

    // Weekly comparison
    const weeklyComparison = [];
    const weeksToShow = Math.min(4, Math.ceil(days / 7));
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekEmission = await Activity.aggregate([
        { $match: { userId, date: { $gte: weekStart, $lt: weekEnd } } },
        { $group: { _id: null, total: { $sum: '$carbonEmission' } } },
      ]);

      weeklyComparison.push({
        week: `W${weeksToShow - i}`,
        emission: weekEmission[0]?.total || 0,
      });
    }

    // Total and average
    const totalEmission = await Activity.aggregate([
      { $match: { userId, date: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$carbonEmission' } } },
    ]);

    const avgDailyEmission = (totalEmission[0]?.total || 0) / days;

    // Generate insights
    const insights = [];
    const topCategory = categoryBreakdown.sort((a, b) => b.value - a.value)[0];
    if (topCategory) {
      const percent = ((topCategory.value / (totalEmission[0]?.total || 1)) * 100).toFixed(0);
      insights.push({
        type: 'info',
        message: `${topCategory.name} contributes ${percent}% of total emissions in this period.`,
      });
    }

    if (avgDailyEmission > 50) {
      insights.push({
        type: 'warning',
        message: 'Daily average emissions are above 50 kg CO₂e. Consider implementing reduction strategies.',
      });
    } else {
      insights.push({
        type: 'success',
        message: 'Daily emissions are within acceptable range. Keep up the good work!',
      });
    }

    res.json({
      monthlyTrend,
      categoryBreakdown,
      weeklyComparison,
      totalEmission: totalEmission[0]?.total || 0,
      avgDailyEmission,
      insights,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/gov/leaderboard - Leaderboard data
router.get('/leaderboard', verifyGovUser, async (req, res) => {
  try {
    const { filter, timeFrame } = req.query;

    let startDate = new Date();
    if (timeFrame === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeFrame === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeFrame === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Get all government users with their emissions
    const leaderboard = await Activity.aggregate([
      {
        $match: {
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalEmission: { $sum: '$carbonEmission' },
          activityCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.role': 'Government' } },
      {
        $project: {
          departmentName: {
            $concat: ['$user.firstName', ' ', '$user.lastName'],
          },
          organizationType: { $ifNull: ['$user.organizationType', 'General'] },
          totalEmission: 1,
          activityCount: 1,
          avgPerActivity: { $divide: ['$totalEmission', '$activityCount'] },
        },
      },
      { $sort: { totalEmission: filter === 'lowest' ? 1 : -1 } },
      { $limit: 20 },
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/gov/carbon-map - Carbon map data
router.get('/carbon-map', verifyGovUser, async (req, res) => {
  try {
    const { filter } = req.query;
    const matchStage = {};

    if (filter && filter !== 'all') {
      matchStage['metadata.organizationType'] = filter;
    }

    const mapData = await Activity.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          emission: { $sum: '$carbonEmission' },
          activityCount: { $sum: 1 },
          categories: { $push: '$category' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.role': 'Government' } },
      {
        $project: {
          departmentName: {
            $concat: ['$user.firstName', ' ', '$user.lastName'],
          },
          organizationType: { $ifNull: ['$user.organizationType', 'General'] },
          emission: 1,
          activityCount: 1,
          topCategory: { $arrayElemAt: ['$categories', 0] },
          location: '$user.country',
        },
      },
    ]);

    res.json(mapData);
  } catch (error) {
    console.error('Carbon map error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/gov/reports/generate - Generate report
router.post('/reports/generate', verifyGovUser, async (req, res) => {
  try {
    const { reportType, format, dateRange } = req.body;
    
    // For now, return a simple success message
    // In production, you would generate actual PDF/CSV/Excel files
    res.json({
      message: 'Report generation initiated',
      reportType,
      format,
      dateRange,
      note: 'Report generation feature is under development. Backend implementation pending.',
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
