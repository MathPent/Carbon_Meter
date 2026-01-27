const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST - Create automatic transport activity
router.post('/automatic-transport', auth, async (req, res) => {
  try {
    const {
      vehicleId,
      vehicleModel,
      distance,
      carbonEmission,
      startLocation,
      endLocation,
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

    // Create activity
    const activity = new Activity({
      userId: req.user._id,
      category: 'Transport',
      logType: 'automatic',
      description: `Map-based transport: ${vehicleModel || 'Vehicle'} - ${distance.toFixed(2)} km`,
      carbonEmission,
      transportData: {
        mode: 'Automatic',
        vehicleId,
        vehicleModel,
        vehicleFuel: fuel,
        distance,
        startLocation,
        endLocation
      },
      source: 'Map + Location',
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
      message: 'Activity saved successfully',
      data: activity
    });
  } catch (error) {
    console.error('Error saving automatic transport activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving activity',
      error: error.message
    });
  }
});

// GET - Get user's automatic transport activities
router.get('/automatic-transport', auth, async (req, res) => {
  try {
    const activities = await Activity.find({
      userId: req.user._id,
      category: 'Transport',
      logType: 'automatic'
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching automatic transport activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
});

module.exports = router;
