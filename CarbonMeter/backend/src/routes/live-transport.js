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

    console.log('[Live Transport] Saving trip:', {
      vehicleId,
      vehicleModel,
      distance: distance?.toFixed(2),
      carbonEmission: carbonEmission?.toFixed(3),
      duration,
      fuel
    });

    // Validate required fields
    if (!vehicleId || !distance || carbonEmission === undefined) {
      console.log('[Live Transport] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, distance, carbonEmission'
      });
    }

    // Validate minimum distance (100 meters = 0.1 km)
    if (distance < 0.1) {
      console.log('[Live Transport] Trip too short:', distance);
      return res.status(400).json({
        success: false,
        message: 'Trip too short to save (minimum 100 meters)'
      });
    }

    // Create activity
    const activity = new Activity({
      userId: req.user.id || req.user._id,
      category: 'Transport',
      logType: 'automatic',
      description: `Live GPS tracking: ${vehicleModel || 'Vehicle'} - ${distance.toFixed(2)} km${duration ? ` (${duration})` : ''}`,
      carbonEmission: Number(carbonEmission.toFixed(3)),
      transportData: {
        mode: 'Automatic',
        vehicleId,
        vehicleModel,
        vehicleFuel: fuel,
        distance: Number(distance.toFixed(2))
      },
      source: 'Live GPS (Web)',
      metadata: {
        duration: duration || 'N/A',
        trackingMethod: 'GPS',
        savedAt: new Date()
      },
      date: new Date(),
      createdAt: new Date()
    });

    await activity.save();
    console.log('[Live Transport] Activity saved:', activity._id);

    // Update user totals (non-blocking)
    try {
      const user = await User.findById(req.user.id || req.user._id);
      if (user) {
        user.totalEmissions = (user.totalEmissions || 0) + carbonEmission;
        user.lastActivityDate = new Date();
        await user.save();
        console.log('[Live Transport] User totals updated');
      }
    } catch (userError) {
      console.error('[Live Transport] Error updating user totals:', userError.message);
      // Don't fail the request if user update fails
    }

    res.status(201).json({
      success: true,
      message: 'Live trip saved successfully',
      data: {
        _id: activity._id,
        distance: activity.transportData.distance,
        carbonEmission: activity.carbonEmission,
        createdAt: activity.createdAt
      }
    });
  } catch (error) {
    console.error('[Live Transport] Error saving activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving activity. Your trip data is preserved in the browser.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
