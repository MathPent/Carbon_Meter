/**
 * Prediction Routes for CarbonMeter ML Integration
 * Connects Node backend with Python ML API
 */

const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const User = require('../models/User');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Middleware to verify JWT (reuse existing auth middleware)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded; // Contains userId as 'id'
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ML API base URL
const ML_API_URL = 'http://localhost:8000';

// CSV paths
const CSV_PATH = path.join(__dirname, '../../../ml/Carbon_meter/calculation_emission/carbonmeter_daily_log.csv');
const INDIA_DATA_PATH = path.join(__dirname, '../../../ml/Carbon_meter/data/individual_carbon_emissions_india.csv');

/**
 * Load user emission profile from India dataset
 */
async function loadUserProfile(userId) {
  return new Promise((resolve, reject) => {
    const profiles = [];
    fs.createReadStream(INDIA_DATA_PATH)
      .pipe(csv())
      .on('data', (row) => profiles.push(row))
      .on('end', () => {
        // Find user profile or return average profile
        const userProfile = profiles.find(p => p.user_id === userId);
        if (userProfile) {
          resolve(userProfile);
        } else {
          // Calculate average profile from dataset
          const avgEmission = profiles.reduce((sum, p) => sum + parseFloat(p.monthly_co2_emission_kg), 0) / profiles.length;
          resolve({
            user_id: userId,
            monthly_co2_emission_kg: avgEmission.toString(),
            daily_avg: (avgEmission / 30).toString()
          });
        }
      })
      .on('error', reject);
  });
}

/**
 * GET /api/prediction/missing-days
 * Returns list of missing dates in recent window
 */
router.get('/missing-days', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Define date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Get all dates with activities for this user
    const activities = await Activity.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).select('date').lean();
    
    // Extract logged dates
    const loggedDates = new Set(
      activities.map(a => {
        const date = new Date(a.date);
        return date.toISOString().split('T')[0];
      })
    );
    
    // Find missing dates
    const missingDays = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      if (!loggedDates.has(dateStr)) {
        missingDays.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
    
    // Sort and return most recent missing days first
    missingDays.sort((a, b) => new Date(b) - new Date(a));
    
    res.json({
      success: true,
      missingDays: missingDays.slice(0, 10) // Return top 10 most recent
    });
    
  } catch (error) {
    console.error('Error finding missing days:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find missing days',
      error: error.message
    });
  }
});

/**
 * POST /api/prediction/predict-missing-day
 * Predicts emission for a specific date
 * Body: { date: "YYYY-MM-DD" }
 */
router.post('/predict-missing-day', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    // Check if date already has a log
    const targetDate = new Date(date);
    const existingActivity = await Activity.findOne({
      userId,
      date: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999))
      }
    });
    
    if (existingActivity) {
      return res.status(409).json({
        success: false,
        message: 'This date already has a logged activity'
      });
    }
    
    // Load user profile from India dataset
    const userProfile = await loadUserProfile(userId);
    
    // Fetch user's last 5 days of detailed activities for realistic prediction
    const targetDateObj = new Date(date);
    const lookbackDate = new Date(targetDateObj);
    lookbackDate.setDate(lookbackDate.getDate() - 5);
    
    // Get detailed activities for pattern analysis
    const recentActivities = await Activity.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: {
        $gte: lookbackDate,
        $lt: targetDateObj
      }
    }).sort({ date: -1 }).limit(10);
    
    let predictedEmission, breakdown, confidence;
    
    if (recentActivities.length === 0) {
      // Use India dataset profile for prediction
      const dailyAvg = userProfile.daily_avg ? parseFloat(userProfile.daily_avg) : parseFloat(userProfile.monthly_co2_emission_kg) / 30;
      predictedEmission = dailyAvg;
      breakdown = {
        transport: Math.round(dailyAvg * 0.35 * 100) / 100,
        electricity: Math.round(dailyAvg * 0.30 * 100) / 100,
        food: Math.round(dailyAvg * 0.25 * 100) / 100,
        waste: Math.round(dailyAvg * 0.10 * 100) / 100
      };
      confidence = 0.65;
    } else {
      // Calculate average emissions by category from recent days
      const categoryTotals = { transport: 0, electricity: 0, food: 0, waste: 0, count: 0 };
      const dailyEmissions = [];
      
      recentActivities.forEach(activity => {
        dailyEmissions.push(activity.carbonEmission);
        
        // Extract category-specific emissions
        if (activity.transportData && activity.transportData.fuelConsumed) {
          categoryTotals.transport += activity.carbonEmission;
        } else if (activity.electricityData && activity.electricityData.consumption) {
          categoryTotals.electricity += activity.carbonEmission;
        } else if (activity.foodData) {
          categoryTotals.food += activity.carbonEmission;
        } else if (activity.wasteData) {
          categoryTotals.waste += activity.carbonEmission;
        } else if (activity.category === 'Transport') {
          categoryTotals.transport += activity.carbonEmission * 0.4;
          categoryTotals.electricity += activity.carbonEmission * 0.25;
          categoryTotals.food += activity.carbonEmission * 0.25;
          categoryTotals.waste += activity.carbonEmission * 0.1;
        } else {
          // Distribute comprehensively
          categoryTotals.transport += activity.carbonEmission * 0.35;
          categoryTotals.electricity += activity.carbonEmission * 0.30;
          categoryTotals.food += activity.carbonEmission * 0.25;
          categoryTotals.waste += activity.carbonEmission * 0.10;
        }
        categoryTotals.count++;
      });
      
      // Calculate average breakdown
      breakdown = {
        transport: Math.round((categoryTotals.transport / categoryTotals.count) * 100) / 100,
        electricity: Math.round((categoryTotals.electricity / categoryTotals.count) * 100) / 100,
        food: Math.round((categoryTotals.food / categoryTotals.count) * 100) / 100,
        waste: Math.round((categoryTotals.waste / categoryTotals.count) * 100) / 100
      };
      
      // Calculate predicted total
      const avgTotal = dailyEmissions.reduce((a, b) => a + b, 0) / dailyEmissions.length;
      predictedEmission = Math.round(avgTotal * 100) / 100;
      
      // Calculate confidence based on data consistency
      const stdDev = Math.sqrt(dailyEmissions.reduce((sq, n) => sq + Math.pow(n - avgTotal, 2), 0) / dailyEmissions.length);
      const coefficient = stdDev / avgTotal;
      confidence = 0.85;
      if (coefficient > 0.3) confidence = 0.70;
      if (coefficient > 0.5) confidence = 0.60;
      if (dailyEmissions.length >= 5) confidence = Math.min(0.92, confidence + 0.07);
    }
    
    return res.json({
      success: true,
      date: date,
      predicted_co2: predictedEmission,
      confidence: confidence,
      demo: recentActivities.length === 0,
      daysUsed: recentActivities.length,
      breakdown: breakdown,
      message: recentActivities.length > 0 
        ? `Prediction based on your last ${recentActivities.length} days of actual activity patterns`
        : `Prediction based on Indian user profile data (User ID: ${userProfile.user_id})`
    });
    
  } catch (error) {
    console.error('Error predicting emission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict emission',
      error: error.message
    });
  }
});

/**
 * POST /api/prediction/confirm
 * Saves confirmed prediction to DB and updates dashboard
 * Body: { date: "YYYY-MM-DD", carbonEmission: 11.2, confidence: 0.86, source: "Predicted (ML)" }
 */
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, carbonEmission, confidence, source, breakdown } = req.body;
    
    if (!date || carbonEmission === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Date and carbonEmission are required'
      });
    }
    
    // Check for duplicates
    const targetDate = new Date(date);
    const existingActivity = await Activity.findOne({
      userId,
      date: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999))
      }
    });
    
    if (existingActivity) {
      return res.status(409).json({
        success: false,
        message: 'Cannot overwrite existing log for this date'
      });
    }
    
    // Use provided breakdown or defaults
    const emissionBreakdown = breakdown || {
      transport: Math.round(carbonEmission * 0.35 * 100) / 100,
      electricity: Math.round(carbonEmission * 0.30 * 100) / 100,
      food: Math.round(carbonEmission * 0.25 * 100) / 100,
      waste: Math.round(carbonEmission * 0.10 * 100) / 100
    };
    
    // Save to MongoDB
    const activity = new Activity({
      userId,
      category: 'Comprehensive',
      logType: 'ML Predicted',
      description: `AI prediction: ${emissionBreakdown.transport.toFixed(2)}kg transport, ${emissionBreakdown.electricity.toFixed(2)}kg electricity, ${emissionBreakdown.food.toFixed(2)}kg food, ${emissionBreakdown.waste.toFixed(2)}kg waste`,
      carbonEmission: carbonEmission,
      date: new Date(date),
      source: source || 'Predicted (ML)',
      metadata: {
        isPredicted: true,
        confidence: confidence || 0.75,
        predictionDate: new Date(),
        breakdown: emissionBreakdown
      },
      comprehensiveData: {
        breakdown: {
          transport: emissionBreakdown.transport,
          electricity: emissionBreakdown.electricity,
          food: emissionBreakdown.food,
          waste: emissionBreakdown.waste,
          total: carbonEmission
        },
        questionnaireType: 'ml_predicted'
      }
    });
    
    await activity.save();
    
    // Update user's badge eligibility if needed
    try {
      const User = require('../models/User');
      const Badge = require('../models/Badge');
      // Trigger badge checks here if you have badge logic
    } catch (badgeError) {
      console.error('Badge update error:', badgeError.message);
      // Don't fail the request if badge check fails
    }
    
    // Append to CSV (safe handling)
    try {
      await appendToCSV(date, carbonEmission, emissionBreakdown);
    } catch (csvError) {
      console.error('CSV append error:', csvError.message);
      // Don't fail the request if CSV fails
    }
    
    res.json({
      success: true,
      message: 'Prediction confirmed and saved successfully',
      activity
    });
    
  } catch (error) {
    console.error('Error saving prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save prediction',
      error: error.message
    });
  }
});

/**
 * Safely append prediction to CSV file
 */
async function appendToCSV(date, totalCO2, breakdown = null) {
  try {
    // Ensure directory exists
    const csvDir = path.dirname(CSV_PATH);
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    
    // Check if CSV exists
    if (!fs.existsSync(CSV_PATH)) {
      // Create with header
      const header = 'date,transport_mode,public_transport_ratio,transport_co2,electricity_co2,cooking_co2,food_co2,waste_co2,digital_co2,avoided_co2,total_co2,estimated\n';
      fs.writeFileSync(CSV_PATH, header, 'utf8');
    }
    
    // Read current content
    let content = fs.readFileSync(CSV_PATH, 'utf8');
    
    // Remove trailing blank lines
    content = content.replace(/\n+$/, '');
    
    // Use breakdown if available, otherwise use defaults
    const transportCO2 = breakdown?.transport || 0.0;
    const electricityCO2 = breakdown?.electricity || 0.0;
    const foodCO2 = breakdown?.food || 0.0;
    const wasteCO2 = breakdown?.waste || 0.0;
    
    // Prepare new row with actual breakdown values
    const newRow = [
      date,
      'Mixed',                         // transport_mode
      '0.6',                           // public_transport_ratio
      transportCO2.toFixed(2),         // transport_co2
      electricityCO2.toFixed(2),       // electricity_co2
      '0.0',                           // cooking_co2 (can be added to breakdown later)
      foodCO2.toFixed(2),              // food_co2
      wasteCO2.toFixed(2),             // waste_co2
      '0.0',                           // digital_co2 (can be added to breakdown later)
      '0.0',                           // avoided_co2
      totalCO2.toFixed(2),             // total_co2
      '1'                         // estimated (1 = ML predicted)
    ].join(',');
    
    // Append with exactly one newline before
    fs.appendFileSync(CSV_PATH, '\n' + newRow, 'utf8');
    
    console.log('✅ CSV updated:', date, 'emission:', totalCO2);
    
  } catch (error) {
    console.error('❌ CSV append failed:', error);
    throw error;
  }
}

module.exports = router;
