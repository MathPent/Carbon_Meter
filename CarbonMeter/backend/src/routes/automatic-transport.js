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

    console.log('[Automatic Transport] Request received:', {
      vehicleId,
      vehicleModel,
      distance,
      carbonEmission,
      hasStartLocation: !!startLocation,
      hasEndLocation: !!endLocation,
      fuel
    });

    // Validate required fields
    if (!vehicleId || !distance || carbonEmission === undefined) {
      console.log('[Automatic Transport] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, distance, carbonEmission'
      });
    }

    // Get user ID (handle both formats)
    const userId = req.user.id || req.user._id;
    console.log('[Automatic Transport] User ID:', userId);

    // Create activity
    const activity = new Activity({
      userId: userId,
      category: 'Transport',
      logType: 'automatic',
      description: `Map-based transport: ${vehicleModel || 'Vehicle'} - ${distance.toFixed(2)} km`,
      carbonEmission: Number(carbonEmission.toFixed(3)),
      transportData: {
        mode: 'Automatic',
        vehicleId,
        vehicleModel,
        vehicleFuel: fuel,
        distance: Number(distance.toFixed(2)),
        startLocation: startLocation || null,
        endLocation: endLocation || null
      },
      source: 'Map + Location',
      date: new Date(),
      createdAt: new Date()
    });

    await activity.save();
    console.log('[Automatic Transport] Activity saved:', activity._id);

    // Update user totals (non-blocking)
    try {
      const user = await User.findById(userId);
      if (user) {
        user.totalEmissions = (user.totalEmissions || 0) + carbonEmission;
        user.lastActivityDate = new Date();
        await user.save();
        console.log('[Automatic Transport] User totals updated');
      }
    } catch (userError) {
      console.error('[Automatic Transport] Error updating user:', userError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Activity saved successfully',
      data: {
        _id: activity._id,
        distance: activity.transportData.distance,
        carbonEmission: activity.carbonEmission,
        createdAt: activity.createdAt
      }
    });
  } catch (error) {
    console.error('[Automatic Transport] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
