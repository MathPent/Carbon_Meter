const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Activity = require('../models/Activity');
const UserTip = require('../models/UserTip');
const axios = require('axios');

// GET /api/tips/personalized - Get personalized tips for user
router.get('/personalized', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const forceRegenerate = req.query.force === 'true';

    console.log(`💡 [Tips] Request for user ${userId}, force: ${forceRegenerate}`);

    // Check if we have recent tips (less than 24 hours old)
    const recentTips = await UserTip.findOne({
      userId,
      generatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ generatedAt: -1 });

    // If force regenerate is requested, delete existing tips
    if (forceRegenerate && recentTips) {
      console.log('🗑️ [Tips] Deleting cached tips for regeneration');
      await UserTip.deleteOne({ _id: recentTips._id });
    } else if (recentTips) {
      console.log('✅ [Tips] Returning cached tips');
      return res.json({
        success: true,
        tips: recentTips.tips,
        emissionSummary: recentTips.emissionSummary,
        cached: true,
        generatedAt: recentTips.generatedAt
      });
    }

    // Fetch user's recent manual logging activities (last day)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activities = await Activity.find({
      userId,
      logType: 'manual',
      date: { $gte: oneDayAgo }
    }).sort({ date: -1 });

    console.log(`📊 [Tips] Found ${activities.length} manual activities`);

    if (activities.length === 0) {
      // No data, return general tips
      return res.json({
        success: true,
        tips: getGeneralTips(),
        emissionSummary: null,
        cached: false,
        message: 'No recent activity found. Showing general tips.'
      });
    }

    // Calculate emission breakdown
    const emissionSummary = calculateEmissionBreakdown(activities);

    // Build AI prompt
    const prompt = buildAIPrompt(emissionSummary, activities);

    // Call Carbox AI - use internal call or construct URL
    const API_BASE_URL = process.env.API_BASE_URL || process.env.BACKEND_URL || 'https://carbon-meter-kixz.onrender.com';
    let aiTips = [];
    try {
      const carboxResponse = await axios.post(`${API_BASE_URL}/api/carbox/generate-tips`, {
        prompt,
        emissionData: emissionSummary
      }, {
        timeout: 30000 // 30 seconds for AI to generate tips
      });

      if (carboxResponse.data && carboxResponse.data.tips) {
        aiTips = carboxResponse.data.tips;
      }
    } catch (aiError) {
      console.error('❌ [Tips] Carbox AI error:', aiError.message);
      // Fallback to rule-based tips
      console.log('🔄 [Tips] Using rule-based tips as fallback');
      aiTips = generateRuleBasedTips(emissionSummary, activities);
    }

    // Normalize tips to match schema enum values
    aiTips = normalizeTips(aiTips);

    console.log(`✅ [Tips] Generated ${aiTips.length} tips for user`);

    // Save tips to database
    const userTip = new UserTip({
      userId,
      tips: aiTips,
      generatedAt: new Date(),
      basedOn: 'last_day',
      emissionSummary
    });
    await userTip.save();

    res.json({
      success: true,
      tips: aiTips,
      emissionSummary,
      cached: false,
      generatedAt: userTip.generatedAt
    });

  } catch (error) {
    console.error('Error generating personalized tips:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating tips',
      error: error.message
    });
  }
});

// GET /api/tips/general - Get general tips (fallback)
router.get('/general', async (req, res) => {
  try {
    res.json({
      success: true,
      tips: getGeneralTips()
    });
  } catch (error) {
    console.error('Error fetching general tips:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching general tips',
      error: error.message
    });
  }
});

// Helper Functions

// Normalize tips to match schema enum values
function normalizeTips(tips) {
  const impactMap = {
    'Low': 'Low',
    'low': 'Low',
    'Medium': 'Medium',
    'medium': 'Medium',
    'High': 'High',
    'high': 'High'
  };

  const difficultyMap = {
    'Easy': 'Easy',
    'easy': 'Easy',
    'Low': 'Easy', // AI sometimes uses "Low" instead of "Easy"
    'low': 'Easy',
    'Medium': 'Medium',
    'medium': 'Medium',
    'Hard': 'Hard',
    'hard': 'Hard',
    'High': 'Hard', // AI sometimes uses "High" instead of "Hard"
    'high': 'Hard'
  };

  return tips.map(tip => ({
    category: tip.category || 'General',
    tip: tip.tip || '',
    impact: impactMap[tip.impact] || 'Medium',
    difficulty: difficultyMap[tip.difficulty] || 'Medium'
  }));
}

function calculateEmissionBreakdown(activities) {
  const breakdown = {
    Transport: 0,
    Electricity: 0,
    Food: 0,
    Waste: 0
  };

  let totalEmissions = 0;

  activities.forEach(activity => {
    const emission = activity.carbonEmission || 0;
    totalEmissions += emission;

    if (breakdown.hasOwnProperty(activity.category)) {
      breakdown[activity.category] += emission;
    }
  });

  // Find highest category
  let highestCategory = 'Transport';
  let highestEmission = 0;
  
  Object.keys(breakdown).forEach(category => {
    if (breakdown[category] > highestEmission) {
      highestEmission = breakdown[category];
      highestCategory = category;
    }
  });

  const highestPercentage = totalEmissions > 0 
    ? ((highestEmission / totalEmissions) * 100).toFixed(1)
    : 0;

  return {
    totalEmissions: parseFloat(totalEmissions.toFixed(2)),
    categoryBreakdown: breakdown,
    highestCategory,
    highestPercentage: parseFloat(highestPercentage),
    activityCount: activities.length
  };
}

function buildAIPrompt(emissionSummary, activities) {
  const { totalEmissions, categoryBreakdown, highestCategory, highestPercentage } = emissionSummary;

  // Get specific details from activities
  let transportDetails = '';
  let electricityDetails = '';
  let foodDetails = '';
  let wasteDetails = '';

  const transportActivities = activities.filter(a => a.category === 'Transport');
  const electricityActivities = activities.filter(a => a.category === 'Electricity');
  const foodActivities = activities.filter(a => a.category === 'Food');
  const wasteActivities = activities.filter(a => a.category === 'Waste');

  if (transportActivities.length > 0) {
    const avgDistance = transportActivities.reduce((sum, a) => sum + (a.transportData?.distance || 0), 0) / transportActivities.length;
    const vehicles = [...new Set(transportActivities.map(a => a.transportData?.vehicleType || 'Car'))];
    transportDetails = `Average distance: ${avgDistance.toFixed(1)} km. Vehicles used: ${vehicles.join(', ')}.`;
  }

  if (electricityActivities.length > 0) {
    const avgConsumption = electricityActivities.reduce((sum, a) => sum + (a.electricityData?.consumption || 0), 0) / electricityActivities.length;
    electricityDetails = `Average consumption: ${avgConsumption.toFixed(1)} kWh.`;
  }

  if (foodActivities.length > 0) {
    const mealTypes = [...new Set(foodActivities.map(a => a.foodData?.mealType || 'Mixed'))];
    foodDetails = `Meal types: ${mealTypes.join(', ')}.`;
  }

  if (wasteActivities.length > 0) {
    wasteDetails = `Waste activities logged: ${wasteActivities.length}.`;
  }

  const prompt = `
You are a carbon footprint expert providing personalized tips for an Indian user.

User's emission data (last 24 hours):
- Total CO₂: ${totalEmissions} kg
- Highest emitting category: ${highestCategory} (${highestPercentage}%)
- Transport emissions: ${categoryBreakdown.Transport.toFixed(2)} kg ${transportDetails}
- Electricity emissions: ${categoryBreakdown.Electricity.toFixed(2)} kg ${electricityDetails}
- Food emissions: ${categoryBreakdown.Food.toFixed(2)} kg ${foodDetails}
- Waste emissions: ${categoryBreakdown.Waste.toFixed(2)} kg ${wasteDetails}

Generate 5 practical, actionable tips to reduce their carbon footprint.

Requirements:
- Focus most on ${highestCategory} since it's their highest emission source
- Tips must be realistic for Indian lifestyle
- Be specific with numbers when possible
- No generic/obvious advice
- No moral judgment
- Prioritize quick wins

IMPORTANT: Use ONLY these exact values:
- "impact": Must be "Low", "Medium", or "High"
- "difficulty": Must be "Easy", "Medium", or "Hard"

Return ONLY a valid JSON array in this exact format:
[
  {
    "category": "Transport",
    "tip": "Specific actionable tip here",
    "impact": "High",
    "difficulty": "Medium"
  }
]
`.trim();

  return prompt;
}

function generateRuleBasedTips(emissionSummary, activities) {
  const tips = [];
  const { categoryBreakdown, highestCategory, totalEmissions } = emissionSummary;

  // Transport tips
  if (categoryBreakdown.Transport > 0) {
    const transportActivities = activities.filter(a => a.category === 'Transport');
    const avgDistance = transportActivities.reduce((sum, a) => sum + (a.transportData?.distance || 0), 0) / transportActivities.length;
    
    if (avgDistance > 20) {
      tips.push({
        category: 'Transport',
        tip: `You travel an average of ${avgDistance.toFixed(0)} km daily. Consider carpooling or public transport 2-3 times per week to reduce ~15-20% transport emissions.`,
        impact: 'High',
        difficulty: 'Medium'
      });
    } else {
      tips.push({
        category: 'Transport',
        tip: 'For short trips under 5 km, try cycling or walking. This can reduce transport emissions by 30% while improving health.',
        impact: 'Medium',
        difficulty: 'Easy'
      });
    }
  }

  // Electricity tips
  if (categoryBreakdown.Electricity > 0) {
    tips.push({
      category: 'Electricity',
      tip: 'Switch to LED bulbs and unplug devices when not in use. This simple change can reduce electricity emissions by 10-15%.',
      impact: 'Medium',
      difficulty: 'Easy'
    });
  }

  // Food tips
  if (categoryBreakdown.Food > 0) {
    tips.push({
      category: 'Food',
      tip: 'Try 2-3 plant-based meals per week. Reducing meat consumption by 30% can lower food-related emissions significantly.',
        impact: 'High',
      difficulty: 'Medium'
    });
  }

  // Waste tips
  if (categoryBreakdown.Waste > 0) {
    tips.push({
      category: 'Waste',
      tip: 'Start composting kitchen waste. This can divert 30% of household waste from landfills and reduce methane emissions.',
      impact: 'Medium',
      difficulty: 'Medium'
    });
  }

  // General appreciation or motivation
  if (totalEmissions < 5) {
    tips.push({
      category: 'General',
      tip: '🌟 Great job! Your daily emissions are below average. Keep maintaining these sustainable habits!',
      impact: 'Low',
      difficulty: 'Easy'
    });
  } else if (highestCategory) {
    tips.push({
      category: highestCategory,
      tip: `${highestCategory} is your largest emission source. Focus on small changes here for maximum impact on your carbon footprint.`,
      impact: 'High',
      difficulty: 'Easy'
    });
  }

  return tips.slice(0, 5);
}

function getGeneralTips() {
  return [
    {
      category: 'Transport',
      tip: 'Use public transport or carpool when possible. This can reduce individual transport emissions by 45%.',
      impact: 'High',
      difficulty: 'Medium'
    },
    {
      category: 'Electricity',
      tip: 'Switch off lights and fans when leaving a room. Set AC to 24-26°C to optimize energy consumption.',
      impact: 'Medium',
      difficulty: 'Easy'
    },
    {
      category: 'Food',
      tip: 'Reduce food waste by planning meals. Composting kitchen waste can reduce methane emissions.',
      impact: 'Medium',
      difficulty: 'Easy'
    },
    {
      category: 'Waste',
      tip: 'Segregate waste at home (wet, dry, recyclable). Avoid single-use plastics wherever possible.',
      impact: 'Medium',
      difficulty: 'Easy'
    },
    {
      category: 'General',
      tip: 'Track your daily carbon footprint to identify patterns. Small consistent changes create lasting impact.',
      impact: 'Low',
      difficulty: 'Easy'
    }
  ];
}

module.exports = router;
