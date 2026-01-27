const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST - Create live transport tracking activity
router.post('/live-transport', auth, async (req, res) => {
  try {
    const {
      vehicleId,
      vehicleModel,
      distance,
      carbonEmission,
      duration,
      category: vehicleCategory,
      fuel
    } = req.body;

    // Validate required fields
    if (!vehicleId || !distance || carbonEmission === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, distance, carbonEmission'
      });
    }

    // Validate minimum distance (100 meters = 0.1 km)
    if (distance < 0.1) {
      return res.status(400).json({
        success: false,
        message: 'Trip too short to save (minimum 100 meters)'
      });
    }

    // Create activity
    const activity = new Activity({
      userId: req.user._id,
      category: 'Transport',
      logType: 'automatic',
      description: `Live GPS tracking: ${vehicleModel || 'Vehicle'} - ${distance.toFixed(2)} km (${duration})`,
      carbonEmission,
      transportData: {
        mode: 'Automatic',
        vehicleId,
        vehicleModel,
        vehicleFuel: fuel,
        distance
      },
      source: 'Live GPS (Web)',
      metadata: {
        duration,
        trackingMethod: 'GPS'
      },
      createdAt: new Date()
    });

    await activity.save();

    // Update user totals
    const user = await User.findById(req.user._id);
    if (user) {
      user.totalEmissions = (user.totalEmissions || 0) + carbonEmission;
      user.lastActivityDate = new Date();
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Live trip saved successfully',
      data: activity
    });
  } catch (error) {
    console.error('Error saving live transport activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving activity',
      error: error.message
    });
  }
});

// GET - Get user's live transport activities
router.get('/live-transport', auth, async (req, res) => {
  try {
    const activities = await Activity.find({
      userId: req.user._id,
      category: 'Transport',
      logType: 'automatic',
      'metadata.trackingMethod': 'GPS'
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching live transport activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
});

module.exports = router;
