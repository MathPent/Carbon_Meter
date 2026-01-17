const express = require('express');
const Activity = require('../models/Activity');

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  // TODO: Verify token with JWT
  next();
};

const router = express.Router();

// Log activity
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { category, description, carbonEmission } = req.body;
    const userId = req.user?.id; // From JWT middleware

    const activity = new Activity({
      userId,
      category,
      description,
      carbonEmission,
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Error logging activity', error: error.message });
  }
});

// Get user activities
router.get('/user/:userId', async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
});

module.exports = router;
