const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const OrgActivity = require('../models/OrgActivity');
const OrganizationPrediction = require('../models/OrganizationPrediction');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8001';

/**
 * POST /api/org/predict
 * Generate AI prediction for organization emissions
 */
router.post('/predict', auth, async (req, res) => {
  try {
    const { period, industry, organizationId } = req.body;
    
    // Use organizationId from body or from authenticated user
    const orgId = organizationId || req.user.id;
    
    // Validate inputs
    if (!period) {
      return res.status(400).json({ 
        success: false, 
        message: 'Period is required (e.g., next_30_days)' 
      });
    }
    
    // Fetch last 30 days of actual data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const historicalData = await OrgActivity.find({
      $or: [
        { userId: orgId },
        { organizationId: orgId }
      ],
      activityDate: { $gte: thirtyDaysAgo },
      isPrediction: { $ne: true } // Exclude predictions
    }).sort({ activityDate: 1 });
    
    // Check if we have enough data
    if (historicalData.length === 0) {
      // Use sample data for demo
      console.log('No historical data found, using sample data');
    }
    
    // Prepare input for ML API
    const mlInput = {
      organization_id: orgId,
      industry: industry || 'Manufacturing',
      period: period,
      historical_data: historicalData.map(activity => ({
        date: activity.activityDate,
        electricity_kwh: activity.rawData?.electricity_kwh || 0,
        diesel_liters: activity.rawData?.diesel_liters || 0,
        natural_gas_m3: activity.rawData?.natural_gas_m3 || 0,
        production_units: activity.rawData?.production_units || 0,
        total_emission: activity.totalEmissions || 0,
      })),
    };
    
    // Call Python ML API
    let mlResponse;
    let isFallback = false;
    
    try {
      mlResponse = await axios.post(`${ML_API_URL}/predict/org`, mlInput, {
        timeout: 15000, // 15 second timeout
      });
    } catch (mlError) {
      console.error('ML API call failed:', mlError.message);
      
      // Fallback to cached prediction or mock data
      const cachedPrediction = await OrganizationPrediction.getLatestPrediction(orgId);
      
      if (cachedPrediction && !cachedPrediction.isExpired()) {
        return res.json({
          success: true,
          prediction: cachedPrediction,
          cached: true,
          message: 'ML service unavailable, showing cached prediction',
        });
      }
      
      // Create mock fallback prediction
      const avgEmission = historicalData.length > 0
        ? historicalData.reduce((sum, act) => sum + (act.totalEmissions || 0), 0) / historicalData.length
        : 500; // Default fallback
      
      mlResponse = {
        data: {
          success: true,
          predicted_emission: avgEmission * 1.05, // Slight increase
          confidence: 0.60,
          industry: industry || 'Manufacturing',
          period: period,
          breakdown: {
            scope1_percentage: 60,
            scope2_percentage: 40,
            scope1_emission: avgEmission * 0.60,
            scope2_emission: avgEmission * 0.40,
          },
          recommendations: [
            'Switch to renewable energy sources',
            'Optimize production processes',
            'Implement energy management system',
          ],
          industry_insights: {
            main_source: 'Energy consumption',
            percentage: '60%',
            reduction_potential: '15-20%',
            benchmark: 'Industry average',
          },
        },
      };
      isFallback = true;
    }
    
    const predictionData = mlResponse.data;
    
    // Save prediction to database (upsert to avoid duplicates)
    const predictionPayload = {
      organizationId: orgId,
      predictedEmission: predictionData.predicted_emission,
      predicted_emission: predictionData.predicted_emission,
      period: period,
      predictedFor: predictionData.predicted_for || new Date().toISOString().slice(0, 7),
      industry: industry || predictionData.industry || 'Manufacturing',
      confidence: predictionData.confidence || 0.70,
      isFallback: isFallback,
      breakdown: predictionData.breakdown,
      recommendations: predictionData.recommendations || [],
      industryInsights: predictionData.industry_insights,
      inputFeatures: {
        electricity_kwh: mlInput.historical_data.map(d => d.electricity_kwh),
        diesel_liters: mlInput.historical_data.map(d => d.diesel_liters),
        natural_gas_m3: mlInput.historical_data.map(d => d.natural_gas_m3),
        production_units: mlInput.historical_data.map(d => d.production_units),
      },
      status: 'completed',
      source: isFallback ? 'Fallback Estimation' : 'XGBoost ML Model',
    };

    const prediction = await OrganizationPrediction.findOneAndUpdate(
      { organizationId: orgId, period },
      { $set: predictionPayload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      prediction: prediction,
      fallback: isFallback,
      message: isFallback ? 'Prediction generated using fallback calculation' : 'Prediction generated successfully',
    });
    
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate prediction',
      error: error.message 
    });
  }
});

/**
 * POST /api/org/save-prediction
 * Save prediction to database and CSV file
 */
router.post('/save-prediction', auth, async (req, res) => {
  try {
    const predictionData = req.body;
    const orgId = req.user.id;
    
    // Validate prediction data
    if (!predictionData || !predictionData.predictedEmission) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid prediction data' 
      });
    }

    // Save to database
    const predictionPayload = {
      organizationId: orgId,
      period: predictionData.period || 'next_30_days',
      industry: predictionData.industry || 'Manufacturing',
      predictedEmission: predictionData.predictedEmission,
      predicted_emission: predictionData.predictedEmission, // Alias for compatibility
      confidence: predictionData.confidence || 0.70,
      breakdown: predictionData.breakdown,
      recommendations: predictionData.recommendations || [],
      industryInsights: predictionData.industryInsights,
      status: 'completed',
      source: predictionData.source || 'XGBoost ML Model',
    };

    const prediction = await OrganizationPrediction.findOneAndUpdate(
      { organizationId: orgId, period: predictionData.period },
      { $set: predictionPayload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Create OrgActivity entries for dashboard visibility
    const breakdown = predictionData.breakdown || {};
    const scope1Emission = breakdown.scope1_emission || (predictionData.predictedEmission * 0.6);
    const scope2Emission = breakdown.scope2_emission || (predictionData.predictedEmission * 0.4);
    
    // Calculate future date based on period
    let futureDate = new Date();
    const periodMatch = (predictionData.period || 'next_30_days').match(/(\d+)/);
    const days = periodMatch ? parseInt(periodMatch[1]) : 30;
    futureDate.setDate(futureDate.getDate() + days);
    
    // Save as OrgActivity entries (one for each scope)
    const activityBase = {
      userId: orgId,
      organizationId: orgId,
      activityDate: futureDate,
      isPrediction: true,
      predictionConfidence: predictionData.confidence || 0.70,
      source: 'AI Forecasting',
      category: 'Manufacturing Operations',
      description: `AI Predicted ${predictionData.period || 'next_30_days'} emissions (${predictionData.industry || 'Manufacturing'})`,
    };

    // Scope 1 Activity
    await OrgActivity.findOneAndUpdate(
      { 
        userId: orgId, 
        isPrediction: true, 
        scope: 'Scope 1',
        activityDate: { $gte: new Date(), $lte: futureDate }
      },
      {
        ...activityBase,
        scope: 'Scope 1',
        emissionValue: scope1Emission,
        totalEmissions: scope1Emission,
      },
      { upsert: true, new: true }
    );

    // Scope 2 Activity
    await OrgActivity.findOneAndUpdate(
      { 
        userId: orgId, 
        isPrediction: true, 
        scope: 'Scope 2',
        activityDate: { $gte: new Date(), $lte: futureDate }
      },
      {
        ...activityBase,
        scope: 'Scope 2',
        emissionValue: scope2Emission,
        totalEmissions: scope2Emission,
      },
      { upsert: true, new: true }
    );

    console.log(`Created/Updated OrgActivity entries for prediction (Total: ${predictionData.predictedEmission} tCO2e)`);

    // Call ML API to save to CSV
    try {
      await axios.post(`${ML_API_URL}/save-csv`, {
        organization_id: orgId,
        industry: predictionData.industry || 'Manufacturing',
        period: predictionData.period || 'next_30_days',
        predicted_emission: predictionData.predictedEmission,
        confidence: predictionData.confidence || 0.70,
        breakdown: predictionData.breakdown,
        recommendations: predictionData.recommendations || [],
      }, {
        timeout: 10000,
      });
      console.log('Prediction saved to CSV successfully');
    } catch (csvError) {
      console.error('Failed to save to CSV:', csvError.message);
      // Don't fail the request if CSV save fails
    }

    res.json({
      success: true,
      prediction: prediction,
      message: 'Prediction saved successfully to database, dashboard, and CSV',
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
 * GET /api/org/prediction/latest
 * Get latest prediction for organization
 */
router.get('/prediction/latest', auth, async (req, res) => {
  try {
    const organizationId = req.query.organizationId || req.user.id;
    
    const prediction = await OrganizationPrediction.getLatestPrediction(organizationId);
    
    if (!prediction) {
      return res.status(404).json({ 
        success: false, 
        message: 'No predictions found' 
      });
    }
    
    res.json({
      success: true,
      prediction: prediction,
    });
    
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch prediction',
      error: error.message 
    });
  }
});

/**
 * GET /api/org/prediction/history
 * Get prediction history for organization
 */
router.get('/prediction/history', auth, async (req, res) => {
  try {
    const organizationId = req.query.organizationId || req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    const predictions = await OrganizationPrediction.getPredictionHistory(organizationId, limit);
    
    res.json({
      success: true,
      predictions: predictions,
      count: predictions.length,
    });
    
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch prediction history',
      error: error.message 
    });
  }
});

/**
 * GET /api/org/ml-status
 * Check if ML API is available
 */
router.get('/ml-status', async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`, { timeout: 5000 });
    res.json({
      success: true,
      mlAvailable: true,
      mlStatus: response.data,
    });
  } catch (error) {
    res.json({
      success: true,
      mlAvailable: false,
      message: 'ML service is currently unavailable',
    });
  }
});

module.exports = router;
