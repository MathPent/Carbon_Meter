const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

// GET /api/map/individual - Get map data for individual user
router.get('/individual', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch activities with location data
    const activities = await Activity.find({
      userId,
      date: { $gte: startDate },
      $or: [
        { 'transportData.startLocation': { $exists: true } },
        { 'transportData.endLocation': { $exists: true } },
        { latitude: { $exists: true } },
        { longitude: { $exists: true } }
      ]
    }).sort({ date: -1 });

    // Transform data for map
    const mapData = [];

    activities.forEach(activity => {
      // For transport activities with route data
      if (activity.transportData) {
        if (activity.transportData.startLocation) {
          mapData.push({
            category: activity.category,
            latitude: activity.transportData.startLocation.latitude,
            longitude: activity.transportData.startLocation.longitude,
            emission: activity.carbonEmission || 0,
            date: activity.date,
            source: activity.logType || 'Manual'
          });
        }
        if (activity.transportData.endLocation) {
          mapData.push({
            category: activity.category,
            latitude: activity.transportData.endLocation.latitude,
            longitude: activity.transportData.endLocation.longitude,
            emission: activity.carbonEmission || 0,
            date: activity.date,
            source: activity.logType || 'Manual'
          });
        }
      }

      // For activities with direct lat/long
      if (activity.latitude && activity.longitude) {
        mapData.push({
          category: activity.category,
          latitude: activity.latitude,
          longitude: activity.longitude,
          emission: activity.carbonEmission || 0,
          date: activity.date,
          source: activity.logType || 'Manual'
        });
      }
    });

    // Remove duplicates (same location, category, and date)
    const uniqueMapData = mapData.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.latitude === item.latitude &&
        t.longitude === item.longitude &&
        t.category === item.category &&
        new Date(t.date).toDateString() === new Date(item.date).toDateString()
      ))
    );

    res.json({
      success: true,
      data: uniqueMapData,
      count: uniqueMapData.length
    });

  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching map data',
      error: error.message
    });
  }
});

module.exports = router;
