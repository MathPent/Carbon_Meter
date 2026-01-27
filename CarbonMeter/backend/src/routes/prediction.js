/**
 * Prediction Routes for CarbonMeter ML Integration
 * Connects Node backend with Python ML API
 */

const express = require('express');
const axios = require('axios');
const Activity = require('../models/Activity');
const router = express.Router();
const fs = require('fs');
const path = require('path');

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
const ML_API_URL = 'http://localhost:5001';

// CSV path (adjust based on your project structure)
const CSV_PATH = path.join(__dirname, '../../../ml/manual_calculation/carbonmeter_daily_log.csv');

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
    
    // Fetch user's last 20 days of emissions (aggregate by day)
    const targetDateObj = new Date(date);
    const lookbackDate = new Date(targetDateObj);
    lookbackDate.setDate(lookbackDate.getDate() - 20);
    
    const activities = await Activity.aggregate([
      {
        $match: {
          userId: userId,
          date: {
            $gte: lookbackDate,
            $lt: targetDateObj
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          totalEmission: { $sum: '$carbonEmission' }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 20
      }
    ]);
    
    // Extract emission values
    const last_n_days = activities.map(a => a.totalEmission);
    
    if (last_n_days.length === 0) {
      // No history - return a reasonable default
      return res.json({
        success: true,
        predictedEmission: 10.0,
        confidence: 'low',
        daysUsed: 0,
        message: 'No history available. Using default estimate.'
      });
    }
    
    // Call ML API
    try {
      const mlResponse = await axios.post(`${ML_API_URL}/predict-missing`, {
        last_n_days
      }, {
        timeout: 5000
      });
      
      return res.json({
        success: true,
        predictedEmission: mlResponse.data.predicted_co2,
        confidence: mlResponse.data.confidence,
        daysUsed: mlResponse.data.days_used || last_n_days.length
      });
      
    } catch (mlError) {
      console.error('ML API error:', mlError.message);
      
      // Fallback: use recent average
      const avgEmission = last_n_days.reduce((a, b) => a + b, 0) / last_n_days.length;
      
      return res.json({
        success: true,
        predictedEmission: Math.round(avgEmission * 100) / 100,
        confidence: 'medium',
        daysUsed: last_n_days.length,
        message: 'ML API unavailable. Using recent average.'
      });
    }
    
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
 * POST /api/prediction/save-predicted-emission
 * Saves confirmed prediction to DB and CSV
 * Body: { date: "YYYY-MM-DD", predictedEmission: 11.2 }
 */
router.post('/save-predicted-emission', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, predictedEmission } = req.body;
    
    if (!date || predictedEmission === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Date and predictedEmission are required'
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
    
    // Save to MongoDB
    const activity = new Activity({
      userId,
      category: 'Comprehensive',
      logType: 'ML Predicted',
      description: 'Behavioral prediction based on recent activity patterns',
      carbonEmission: predictedEmission,
      date: new Date(date),
      source: 'Behavioral Prediction',
      metadata: {
        isPredicted: true,
        predictionDate: new Date()
      },
      comprehensiveData: {
        breakdown: {
          transport: 0,
          electricity: 0,
          food: 0,
          waste: 0,
          total: predictedEmission
        },
        questionnaireType: 'ml_predicted'
      }
    });
    
    await activity.save();
    
    // Append to CSV (safe handling of blank lines)
    try {
      await appendToCSV(date, predictedEmission);
    } catch (csvError) {
      console.error('CSV append error:', csvError.message);
      // Don't fail the request if CSV fails
    }
    
    res.json({
      success: true,
      message: 'Prediction saved successfully',
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
async function appendToCSV(date, totalCO2) {
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
    
    // Prepare new row with defaults
    const newRow = [
      date,
      'Mixed',                    // transport_mode
      '0.6',                      // public_transport_ratio
      '0.0',                      // transport_co2
      '0.0',                      // electricity_co2
      '0.0',                      // cooking_co2
      '0.0',                      // food_co2
      '0.0',                      // waste_co2
      '0.0',                      // digital_co2
      '0.0',                      // avoided_co2
      totalCO2.toFixed(2),        // total_co2
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
