const express = require('express');
const jwt = require('jsonwebtoken');
const Badge = require('../models/Badge');
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
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const router = express.Router();

// Badge eligibility criteria
const BADGE_CRITERIA = {
  'First Step': {
    description: 'Log your first carbon activity',
    condition: async (userId) => {
      const count = await Activity.countDocuments({ userId });
      return count >= 1;
    }
  },
  'Eco Warrior': {
    description: 'Log 10 activities',
    condition: async (userId) => {
      const count = await Activity.countDocuments({ userId });
      return count >= 10;
    }
  },
  'Carbon Conscious': {
    description: 'Log 50 activities',
    condition: async (userId) => {
      const count = await Activity.countDocuments({ userId });
      return count >= 50;
    }
  },
  'Green Champion': {
    description: 'Keep monthly emissions under 100 kg CO2e',
    condition: async (userId) => {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const activities = await Activity.find({
        userId,
        date: { $gte: firstDayOfMonth }
      });
      
      const monthlyEmissions = activities.reduce((sum, act) => sum + act.carbonEmission, 0);
      return monthlyEmissions <= 100;
    }
  },
  'Low Carbon Hero': {
    description: 'Keep monthly emissions under 50 kg CO2e',
    condition: async (userId) => {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const activities = await Activity.find({
        userId,
        date: { $gte: firstDayOfMonth }
      });
      
      const monthlyEmissions = activities.reduce((sum, act) => sum + act.carbonEmission, 0);
      return monthlyEmissions <= 50;
    }
  },
  'Consistency King': {
    description: 'Log activities for 7 consecutive days',
    condition: async (userId) => {
      const activities = await Activity.find({ userId }).sort({ date: -1 });
      if (activities.length < 7) return false;
      
      let consecutiveDays = 1;
      for (let i = 1; i < activities.length; i++) {
        const diff = Math.abs(new Date(activities[i-1].date) - new Date(activities[i].date));
        const daysDiff = diff / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 1.5) { // Allow some flexibility
          consecutiveDays++;
          if (consecutiveDays >= 7) return true;
        } else {
          consecutiveDays = 1;
        }
      }
      return false;
    }
  },
  'Multi-Category Master': {
    description: 'Log activities in all 4 categories',
    condition: async (userId) => {
      const categories = await Activity.distinct('category', { userId });
      return categories.length >= 4;
    }
  },
};

// Check and award badges
router.post('/check-eligibility', authMiddleware, async (req, res) => {
  try {
    // Extract userId from JWT token (JWT payload has 'id' property)
    const userId = req.user.id;
    const newBadges = [];

    // Check each badge criteria
    for (const [badgeName, criteria] of Object.entries(BADGE_CRITERIA)) {
      // Check if user already has this badge
      const existingBadge = await Badge.findOne({ userId, name: badgeName });
      if (existingBadge) continue;

      // Check if user meets the criteria
      const eligible = await criteria.condition(userId);
      if (eligible) {
        const badge = new Badge({
          userId,
          name: badgeName,
          description: criteria.description,
          earnedAt: new Date(),
        });
        await badge.save();
        newBadges.push(badge);
      }
    }

    res.json({
      success: true,
      newBadges,
      message: newBadges.length > 0 
        ? `Congratulations! You earned ${newBadges.length} new badge(s)!`
        : 'No new badges earned',
    });
  } catch (error) {
    console.error('Error checking badge eligibility:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error checking badges', 
      error: error.message 
    });
  }
});

// Get user's badges
router.get('/user-badges', authMiddleware, async (req, res) => {
  try {
    // Extract userId from JWT token (JWT payload has 'id' property)
    const userId = req.user.id;
    const badges = await Badge.find({ userId }).sort({ earnedAt: -1 });

    res.json({
      success: true,
      badges,
      totalBadges: badges.length,
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching badges', 
      error: error.message 
    });
  }
});

// Get all available badges
router.get('/available', authMiddleware, async (req, res) => {
  try {
    // Extract userId from JWT token (JWT payload has 'id' property)
    const userId = req.user.id;
    const earnedBadges = await Badge.find({ userId });
    const earnedNames = earnedBadges.map(b => b.name);

    const allBadges = Object.entries(BADGE_CRITERIA).map(([name, criteria]) => ({
      name,
      description: criteria.description,
      earned: earnedNames.includes(name),
      earnedAt: earnedBadges.find(b => b.name === name)?.earnedAt,
    }));

    res.json({
      success: true,
      badges: allBadges,
    });
  } catch (error) {
    console.error('Error fetching available badges:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching badges', 
      error: error.message 
    });
  }
});

module.exports = router;
