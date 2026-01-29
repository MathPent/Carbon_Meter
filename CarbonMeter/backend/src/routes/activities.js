const express = require('express');
const jwt = require('jsonwebtoken');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    console.log('[Auth] Verifying token with secret:', secret.substring(0, 10) + '...');
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Contains userId as 'id'
    console.log('[Auth] Token verified for user:', decoded.id);
    next();
  } catch (error) {
    console.log('[Auth] Token verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const router = express.Router();

// Organization: Save emission calculation
router.post('/org-emission', authMiddleware, async (req, res) => {
  try {
    const { timePeriod, startDate, endDate, scope1, scope2, scope3, totalEmissions, perEmployee, perRevenue, rawData } = req.body;
    const userId = req.user.id;

    const activity = new Activity({
      userId,
      category: 'Organization',
      logType: 'organization',
      description: `Organizational emission report (${timePeriod})`,
      carbonEmission: totalEmissions,
      organizationData: {
        timePeriod,
        startDate,
        endDate,
        scope1,
        scope2,
        scope3,
        perEmployee,
        perRevenue,
        rawData,
      },
    });

    await activity.save();
    res.status(201).json({ message: 'Organization emission saved', activity });
  } catch (error) {
    console.error('Error saving organization emission:', error);
    res.status(500).json({ message: 'Error saving emission data', error: error.message });
  }
});

// Organization: Get dashboard stats
router.get('/org-stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activities = await Activity.find({ 
      userId, 
      logType: 'organization' 
    }).sort({ createdAt: -1 });

    let totalEmissions = 0;
    let scope1 = 0;
    let scope2 = 0;
    let scope3 = 0;
    let lastUpdated = null;

    activities.forEach(activity => {
      if (activity.organizationData) {
        scope1 += activity.organizationData.scope1 || 0;
        scope2 += activity.organizationData.scope2 || 0;
        scope3 += activity.organizationData.scope3 || 0;
        totalEmissions += activity.carbonEmission || 0;
        if (!lastUpdated || activity.createdAt > lastUpdated) {
          lastUpdated = activity.createdAt;
        }
      }
    });

    // Get latest calculation for per-employee and per-revenue metrics
    let perEmployee = 0;
    let perRevenue = 0;
    if (activities.length > 0 && activities[0].organizationData) {
      perEmployee = activities[0].organizationData.perEmployee || 0;
      perRevenue = activities[0].organizationData.perRevenue || 0;
    }

    res.json({
      totalEmissions,
      scope1,
      scope2,
      scope3,
      perEmployee,
      perRevenue,
      lastUpdated,
    });
  } catch (error) {
    console.error('Error fetching org stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Organization: Get activity history
router.get('/org-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activities = await Activity.find({ 
      userId, 
      logType: 'organization' 
    }).sort({ createdAt: -1 });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching org history:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

// Normalize category strings (accept lower/upper case and map to enum values)
const normalizeCategory = (category = '') => {
  const map = {
    transport: 'Transport',
    electricity: 'Electricity',
    food: 'Food',
    waste: 'Waste',
    comprehensive: 'Comprehensive',
    organization: 'Organization',
  };

  const key = category.toString().trim().toLowerCase();
  return map[key] || category;
};

// Log manual activity with complete data
router.post('/log-manual', authMiddleware, async (req, res) => {
  try {
    const { category, logType, description, carbonEmission, data, formula, source } = req.body;
    const userId = req.user.id;

    const normalizedCategory = normalizeCategory(category);
    const normalizedLogType = logType || 'manual';

    const activityData = {
      userId,
      category: normalizedCategory,
      logType: normalizedLogType,
      description,
      carbonEmission,
      formula,
      source,
    };

    switch (normalizedCategory) {
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
      case 'Comprehensive':
        activityData.comprehensiveData = data;
        break;
      case 'Organization':
        activityData.organizationData = data;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid activity category',
        });
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
    
    // Check if we should include predicted data
    const includePredicted = req.query.includePredicted === 'true';
    
    // Build query filter
    const query = { userId };
    if (!includePredicted) {
      // Exclude ML Predicted activities
      query.logType = { $ne: 'ML Predicted' };
    }
    
    // Get all activities for user
    const activities = await Activity.find(query);
    
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
        logType: activity.logType, // Include logType to show if it's predicted
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
    const period = req.query.period || 'monthly'; // all, monthly, weekly
    console.log('[Leaderboard] Request received. Period:', period);
    
    let dateFilter = {};
    if (period === 'monthly') {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      dateFilter = { date: { $gte: firstDayOfMonth } };
      console.log('[Leaderboard] Monthly filter:', firstDayOfMonth);
    } else if (period === 'weekly') {
      const firstDayOfWeek = new Date();
      firstDayOfWeek.setDate(firstDayOfWeek.getDate() - 7);
      firstDayOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { date: { $gte: firstDayOfWeek } };
      console.log('[Leaderboard] Weekly filter:', firstDayOfWeek);
    }

    // Count total activities for debugging
    const totalActivitiesCount = await Activity.countDocuments(dateFilter);
    console.log(`[Leaderboard] Total activities matching filter: ${totalActivitiesCount}`);

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

    console.log(`[Leaderboard] Found ${leaderboard.length} users in aggregation`);

    if (leaderboard.length === 0) {
      return res.json({
        success: true,
        leaderboard: [],
        period,
        message: 'No activities found for this period. Start logging to appear on the leaderboard!'
      });
    }

    // Populate user details
    const leaderboardWithUsers = await Promise.all(
      leaderboard.map(async (entry, index) => {
        const user = await User.findById(entry._id).select('firstName lastName email');
        const displayName = user?.firstName 
          ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
          : user?.email?.split('@')[0] || 'Anonymous';
        
        console.log(`[Leaderboard] User ${index + 1}:`, displayName, 'Emissions:', entry.totalEmissions);
        
        return {
          rank: index + 1,
          userId: entry._id,
          username: displayName,
          totalEmissions: entry.totalEmissions > 1000000 ? 0 : Math.round(entry.totalEmissions * 100) / 100,
          activitiesCount: entry.activitiesCount,
        };
      })
    );

    console.log(`[Leaderboard] Returning ${leaderboardWithUsers.length} users`);

    res.json({
      success: true,
      leaderboard: leaderboardWithUsers,
      period,
    });
  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching leaderboard', 
      error: error.message 
    });
  }
});

// ============================================
// AUTOMATIC TRANSPORT ROUTES
// ============================================

// Get vehicles by category
router.get('/vehicles', async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = category ? { category } : {};
    const vehicles = await Vehicle.find(query).sort({ model: 1 });
    
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ 
      message: 'Error fetching vehicles', 
      error: error.message 
    });
  }
});

// Get all vehicle categories
router.get('/vehicles/categories', async (req, res) => {
  try {
    const categories = await Vehicle.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// Log automatic transport activity
router.post('/automatic-transport', authMiddleware, async (req, res) => {
  try {
    const {
      vehicleId,
      vehicleModel,
      vehicleFuel,
      distance,
      carbonEmission,
      source,
      startLocation,
      endLocation
    } = req.body;
    
    const userId = req.user.id;

    // Validate required fields
    if (!vehicleId || !distance || !carbonEmission || !startLocation || !endLocation) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['vehicleId', 'distance', 'carbonEmission', 'startLocation', 'endLocation']
      });
    }

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Create automatic transport activity
    const activity = new Activity({
      userId,
      category: 'Transport',
      logType: 'automatic',
      description: `Automatic trip: ${distance} km using ${vehicleModel || vehicle.model}`,
      carbonEmission,
      source: source || 'Map + Location',
      formula: `${distance} km × ${vehicle.co2_per_km} kg/km`,
      transportData: {
        mode: 'Automatic',
        vehicleId,
        vehicleModel: vehicleModel || vehicle.model,
        vehicleFuel: vehicleFuel || vehicle.fuel,
        distance,
        startLocation: {
          lat: startLocation.lat,
          lng: startLocation.lng
        },
        endLocation: {
          lat: endLocation.lat,
          lng: endLocation.lng
        }
      }
    });

    await activity.save();

    // Update user's total carbon footprint
    await User.findByIdAndUpdate(
      userId,
      { $inc: { totalCarbonFootprint: carbonEmission } }
    );

    res.status(201).json({
      success: true,
      message: 'Automatic transport activity logged successfully',
      activity,
      carbonEmission
    });

  } catch (error) {
    console.error('Error logging automatic transport:', error);
    res.status(500).json({ 
      message: 'Error logging automatic transport activity', 
      error: error.message 
    });
  }
});

// Get automatic transport activities for a user
router.get('/automatic-trips', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const activities = await Activity.find({
      userId,
      category: 'Transport',
      logType: 'automatic'
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    // Calculate summary statistics
    const totalTrips = activities.length;
    const totalDistance = activities.reduce((sum, act) => 
      sum + (act.transportData?.distance || 0), 0
    );
    const totalEmissions = activities.reduce((sum, act) => 
      sum + act.carbonEmission, 0
    );

    res.json({
      success: true,
      trips: activities,
      summary: {
        totalTrips,
        totalDistance: Number(totalDistance.toFixed(2)),
        totalEmissions: Number(totalEmissions.toFixed(3)),
        averageDistance: totalTrips > 0 ? Number((totalDistance / totalTrips).toFixed(2)) : 0,
        averageEmission: totalTrips > 0 ? Number((totalEmissions / totalTrips).toFixed(3)) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching automatic trips:', error);
    res.status(500).json({ 
      message: 'Error fetching automatic trips', 
      error: error.message 
    });
  }
});

module.exports = router;
