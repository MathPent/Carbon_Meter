const OrgActivity = require('../models/OrgActivity');
const CarbonCredit = require('../models/CarbonCredit');
const User = require('../models/User');

/**
 * Emission Factors (IPCC & India CPCB standards)
 * All values in kg CO2e per unit
 */
const EMISSION_FACTORS = {
  // Scope 1 - Fuels
  'Petrol': { value: 2.31, unit: 'kg CO2e/litre', source: 'IPCC 2006' },
  'Diesel': { value: 2.68, unit: 'kg CO2e/litre', source: 'IPCC 2006' },
  'CNG': { value: 1.85, unit: 'kg CO2e/kg', source: 'IPCC 2006' },
  'Natural Gas': { value: 2.0, unit: 'kg CO2e/cubic meter', source: 'IPCC 2006' },
  'LPG': { value: 2.98, unit: 'kg CO2e/kg', source: 'IPCC 2006' },
  'Coal': { value: 2.86, unit: 'kg CO2e/kg', source: 'IPCC 2006' },
  'Furnace Oil': { value: 3.15, unit: 'kg CO2e/litre', source: 'IPCC 2006' },
  
  // Scope 2 - Energy
  'Electricity (Grid)': { value: 0.82, unit: 'kg CO2e/kWh', source: 'India CEA 2023' },
  'Electricity (Renewable)': { value: 0.0, unit: 'kg CO2e/kWh', source: 'Zero emission' },
  'Steam': { value: 340, unit: 'kg CO2e/ton', source: 'Industry average' },
  'Heating': { value: 0.25, unit: 'kg CO2e/kWh', source: 'Industry average' },
  'Cooling': { value: 0.18, unit: 'kg CO2e/kWh', source: 'Industry average' },
  
  // Scope 3 - Transport
  'Air Travel': { value: 0.255, unit: 'kg CO2e/passenger-km', source: 'DEFRA 2023' },
  'Rail Travel': { value: 0.041, unit: 'kg CO2e/passenger-km', source: 'DEFRA 2023' },
  'Road Freight': { value: 0.062, unit: 'kg CO2e/ton-km', source: 'IPCC' },
  'Rail Freight': { value: 0.022, unit: 'kg CO2e/ton-km', source: 'IPCC' },
  'Ship Freight': { value: 0.016, unit: 'kg CO2e/ton-km', source: 'IMO 2021' },
  'Car Commute': { value: 0.192, unit: 'kg CO2e/km', source: 'IPCC' },
  'Hotel Night': { value: 12.5, unit: 'kg CO2e/night', source: 'Industry average' },
  
  // Scope 3 - Waste
  'Landfill': { value: 420, unit: 'kg CO2e/ton', source: 'IPCC Waste' },
  'Recycled': { value: 50, unit: 'kg CO2e/ton', source: 'IPCC Waste' },
  'Incinerated': { value: 330, unit: 'kg CO2e/ton', source: 'IPCC Waste' },
  
  // Scope 3 - Purchased Goods (estimated)
  'Raw Materials': { value: 0.5, unit: 'kg CO2e/INR', source: 'Industry estimate' },
  'Capital Goods': { value: 0.3, unit: 'kg CO2e/INR', source: 'Industry estimate' },
};

/**
 * Get organization dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user details for organization info
    const user = await User.findById(userId);
    
    // Get all activities for this organization
    const activities = await OrgActivity.find({ userId }).sort({ activityDate: -1 });
    
    // Calculate total emissions by scope
    const scope1Total = activities
      .filter(a => a.scope === 'Scope 1')
      .reduce((sum, a) => sum + a.emissionValue, 0);
    
    const scope2Total = activities
      .filter(a => a.scope === 'Scope 2')
      .reduce((sum, a) => sum + a.emissionValue, 0);
    
    const scope3Total = activities
      .filter(a => a.scope === 'Scope 3')
      .reduce((sum, a) => sum + a.emissionValue, 0);
    
    const totalEmissions = scope1Total + scope2Total + scope3Total;
    
    // Calculate intensity metrics
    const perEmployee = user.numberOfEmployees > 0 
      ? totalEmissions / user.numberOfEmployees 
      : 0;
    
    const perRevenue = user.annualRevenue > 0 
      ? totalEmissions / user.annualRevenue * 1000000 // per million INR
      : 0;
    
    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await OrgActivity.aggregate([
      {
        $match: {
          userId: userId,
          activityDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$activityDate' },
            month: { $month: '$activityDate' },
          },
          totalEmissions: { $sum: '$emissionValue' },
          scope1: {
            $sum: {
              $cond: [{ $eq: ['$scope', 'Scope 1'] }, '$emissionValue', 0],
            },
          },
          scope2: {
            $sum: {
              $cond: [{ $eq: ['$scope', 'Scope 2'] }, '$emissionValue', 0],
            },
          },
          scope3: {
            $sum: {
              $cond: [{ $eq: ['$scope', 'Scope 3'] }, '$emissionValue', 0],
            },
          },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);
    
    // Format monthly data
    const monthlyTrend = monthlyData.map(m => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      total: m.totalEmissions,
      scope1: m.scope1,
      scope2: m.scope2,
      scope3: m.scope3,
    }));
    
    // Get carbon credit balance
    const creditTransactions = await CarbonCredit.find({ userId });
    const creditsEarned = creditTransactions
      .filter(c => ['earned', 'purchased'].includes(c.transactionType))
      .reduce((sum, c) => sum + c.credits, 0);
    
    const creditsUsed = creditTransactions
      .filter(c => c.transactionType === 'used')
      .reduce((sum, c) => sum + c.credits, 0);
    
    const creditBalance = creditsEarned - creditsUsed;
    
    // Calculate compliance status
    // Example: Assume 100 tCO2e is the baseline/allowed limit
    const allowedLimit = 100;
    const excessEmissions = Math.max(0, totalEmissions - allowedLimit);
    const complianceStatus = totalEmissions < allowedLimit * 0.8 ? 'Good' 
      : totalEmissions < allowedLimit ? 'Warning' 
      : 'Exceeded';
    
    res.json({
      totalEmissions,
      scope1: scope1Total,
      scope2: scope2Total,
      scope3: scope3Total,
      perEmployee,
      perRevenue,
      monthlyTrend,
      creditBalance,
      creditsEarned,
      creditsUsed,
      allowedLimit,
      excessEmissions,
      complianceStatus,
      activityCount: activities.length,
      lastUpdated: activities.length > 0 ? activities[0].activityDate : null,
      organizationInfo: {
        name: user.organizationName,
        industryType: user.industryType,
        employees: user.numberOfEmployees,
        revenue: user.annualRevenue,
        location: user.location,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * Calculate emissions from form data
 */
exports.calculateEmissions = async (req, res) => {
  try {
    const { activityData, scope, category } = req.body;
    
    let emissionValue = 0;
    let emissionFactor = null;
    let calculationDetails = [];
    
    // Calculate based on activity type
    if (activityData.fuelType && activityData.quantity) {
      const factor = EMISSION_FACTORS[activityData.fuelType];
      if (factor) {
        emissionValue = (activityData.quantity * factor.value) / 1000; // Convert to tonnes
        emissionFactor = factor;
        calculationDetails.push({
          item: activityData.fuelType,
          quantity: activityData.quantity,
          unit: activityData.unit,
          factor: factor.value,
          emission: emissionValue,
        });
      }
    }
    
    // Electricity calculation
    if (activityData.consumption && category === 'Electricity Consumption') {
      const source = activityData.source || 'Electricity (Grid)';
      const factor = EMISSION_FACTORS[source];
      if (factor) {
        emissionValue = (activityData.consumption * factor.value) / 1000; // Convert to tonnes
        emissionFactor = factor;
        calculationDetails.push({
          item: 'Electricity',
          quantity: activityData.consumption,
          unit: 'kWh',
          factor: factor.value,
          emission: emissionValue,
        });
      }
    }
    
    // Transport calculation
    if (activityData.distance && activityData.mode) {
      const modeKey = activityData.mode === 'Air' ? 'Air Travel'
        : activityData.mode === 'Rail' ? 'Rail Travel'
        : activityData.mode === 'Road' ? 'Road Freight'
        : activityData.mode === 'Ship' ? 'Ship Freight'
        : 'Car Commute';
      
      const factor = EMISSION_FACTORS[modeKey];
      if (factor) {
        let emission = activityData.distance * factor.value;
        
        // For freight, multiply by weight
        if (activityData.weight && ['Road Freight', 'Rail Freight', 'Ship Freight'].includes(modeKey)) {
          emission = activityData.distance * activityData.weight * factor.value;
        }
        
        emissionValue = emission / 1000; // Convert to tonnes
        emissionFactor = factor;
        calculationDetails.push({
          item: modeKey,
          distance: activityData.distance,
          weight: activityData.weight,
          factor: factor.value,
          emission: emissionValue,
        });
      }
    }
    
    res.json({
      success: true,
      emissionValue: parseFloat(emissionValue.toFixed(4)),
      emissionUnit: 'tCO2e',
      emissionFactor,
      calculationDetails,
    });
  } catch (error) {
    console.error('Error calculating emissions:', error);
    res.status(500).json({ 
      message: 'Emission calculation failed',
      error: error.message,
    });
  }
};

/**
 * Log a new activity
 */
exports.logActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    const activityData = {
      ...req.body,
      userId,
      organizationName: user.organizationName,
    };
    
    const activity = new OrgActivity(activityData);
    await activity.save();
    
    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      activity,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ 
      message: 'Failed to log activity',
      error: error.message,
    });
  }
};

/**
 * Get all activities for organization
 */
exports.getActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scope, category, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const query = { userId };
    
    if (scope) query.scope = scope;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.activityDate = {};
      if (startDate) query.activityDate.$gte = new Date(startDate);
      if (endDate) query.activityDate.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const activities = await OrgActivity.find(query)
      .sort({ activityDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await OrgActivity.countDocuments(query);
    
    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ 
      message: 'Failed to fetch activities',
      error: error.message,
    });
  }
};

/**
 * Get analytics data
 */
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;
    
    // Emission trend by month
    const trendData = await OrgActivity.aggregate([
      {
        $match: {
          userId: userId,
          activityDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$activityDate' },
            scope: '$scope',
          },
          emissions: { $sum: '$emissionValue' },
        },
      },
      {
        $sort: { '_id.month': 1 },
      },
    ]);
    
    // Category breakdown
    const categoryBreakdown = await OrgActivity.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $group: {
          _id: '$category',
          totalEmissions: { $sum: '$emissionValue' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalEmissions: -1 },
      },
    ]);
    
    // Scope breakdown
    const scopeBreakdown = await OrgActivity.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $group: {
          _id: '$scope',
          totalEmissions: { $sum: '$emissionValue' },
          count: { $sum: 1 },
        },
      },
    ]);
    
    res.json({
      trendData,
      categoryBreakdown,
      scopeBreakdown,
      year: parseInt(year),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics',
      error: error.message,
    });
  }
};

/**
 * Get carbon credit summary
 */
exports.getCarbonCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const transactions = await CarbonCredit.find({ userId })
      .sort({ transactionDate: -1 });
    
    const earned = transactions
      .filter(t => ['earned', 'purchased'].includes(t.transactionType))
      .reduce((sum, t) => sum + t.credits, 0);
    
    const used = transactions
      .filter(t => t.transactionType === 'used')
      .reduce((sum, t) => sum + t.credits, 0);
    
    const balance = earned - used;
    
    const totalCost = transactions
      .filter(t => t.transactionType === 'purchased')
      .reduce((sum, t) => sum + (t.totalCost || 0), 0);
    
    const totalRevenue = transactions
      .filter(t => t.transactionType === 'transferred')
      .reduce((sum, t) => sum + (t.totalCost || 0), 0);
    
    res.json({
      balance,
      earned,
      used,
      totalCost,
      totalRevenue,
      transactions: transactions.slice(0, 20), // Latest 20
    });
  } catch (error) {
    console.error('Error fetching carbon credits:', error);
    res.status(500).json({ 
      message: 'Failed to fetch carbon credits',
      error: error.message,
    });
  }
};

/**
 * Add carbon credit transaction
 */
exports.addCarbonCredit = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    const creditData = {
      ...req.body,
      userId,
      organizationName: user.organizationName,
    };
    
    const credit = new CarbonCredit(creditData);
    await credit.save();
    
    res.status(201).json({
      success: true,
      message: 'Carbon credit transaction added',
      credit,
    });
  } catch (error) {
    console.error('Error adding carbon credit:', error);
    res.status(500).json({ 
      message: 'Failed to add carbon credit',
      error: error.message,
    });
  }
};

/**
 * Earn carbon credits (from reduction projects)
 */
exports.earnCarbonCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const { credits, source, description, verified = false } = req.body;
    
    if (!credits || credits <= 0) {
      return res.status(400).json({ 
        message: 'Invalid credit amount' 
      });
    }
    
    if (!source) {
      return res.status(400).json({ 
        message: 'Credit source is required' 
      });
    }
    
    // Only allow earning credits if verified
    if (!verified) {
      return res.status(400).json({ 
        message: 'Credits can only be earned from verified projects. Please submit for verification first.' 
      });
    }
    
    const creditData = {
      userId,
      organizationName: user.organizationName,
      transactionType: 'earned',
      credits: parseFloat(credits),
      creditType: 'Renewable Energy',
      source,
      description,
      verified: true,
      transactionDate: new Date(),
    };
    
    const credit = new CarbonCredit(creditData);
    await credit.save();
    
    // Get updated balance
    const allCredits = await CarbonCredit.find({ userId });
    const earned = allCredits
      .filter(c => ['earned', 'purchased'].includes(c.transactionType))
      .reduce((sum, c) => sum + c.credits, 0);
    const used = allCredits
      .filter(c => c.transactionType === 'used')
      .reduce((sum, c) => sum + c.credits, 0);
    const balance = earned - used;
    
    res.status(201).json({
      success: true,
      message: `Successfully earned ${credits} carbon credits`,
      credit,
      balance,
    });
  } catch (error) {
    console.error('Error earning carbon credits:', error);
    res.status(500).json({ 
      message: 'Failed to earn carbon credits',
      error: error.message,
    });
  }
};

/**
 * Purchase carbon credits
 */
exports.purchaseCarbonCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const { credits, pricePerCredit } = req.body;
    
    if (!credits || credits <= 0) {
      return res.status(400).json({ 
        message: 'Invalid credit amount' 
      });
    }
    
    const price = pricePerCredit || 1500; // Default ₹1500 per credit
    
    // Validate price range
    if (price < 500 || price > 3000) {
      return res.status(400).json({ 
        message: 'Price per credit must be between ₹500 and ₹3,000' 
      });
    }
    
    const totalCost = credits * price;
    
    const creditData = {
      userId,
      organizationName: user.organizationName,
      transactionType: 'purchased',
      credits: parseFloat(credits),
      creditType: 'Purchased',
      source: 'Carbon Market',
      description: `Purchased ${credits} carbon credits at ₹${price} per credit`,
      pricePerCredit: price,
      totalCost,
      currency: 'INR',
      verified: true,
      transactionDate: new Date(),
    };
    
    const credit = new CarbonCredit(creditData);
    await credit.save();
    
    // Get updated balance
    const allCredits = await CarbonCredit.find({ userId });
    const earned = allCredits
      .filter(c => ['earned', 'purchased'].includes(c.transactionType))
      .reduce((sum, c) => sum + c.credits, 0);
    const used = allCredits
      .filter(c => c.transactionType === 'used')
      .reduce((sum, c) => sum + c.credits, 0);
    const balance = earned - used;
    
    res.status(201).json({
      success: true,
      message: `Successfully purchased ${credits} carbon credits for ₹${totalCost.toLocaleString('en-IN')}`,
      credit,
      balance,
      totalCost,
    });
  } catch (error) {
    console.error('Error purchasing carbon credits:', error);
    res.status(500).json({ 
      message: 'Failed to purchase carbon credits',
      error: error.message,
    });
  }
};

/**
 * Use carbon credits to offset emissions
 */
exports.useCarbonCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const { credits, reason } = req.body;
    
    if (!credits || credits <= 0) {
      return res.status(400).json({ 
        message: 'Invalid credit amount' 
      });
    }
    
    // Check current balance
    const allCredits = await CarbonCredit.find({ userId });
    const earned = allCredits
      .filter(c => ['earned', 'purchased'].includes(c.transactionType))
      .reduce((sum, c) => sum + c.credits, 0);
    const used = allCredits
      .filter(c => c.transactionType === 'used')
      .reduce((sum, c) => sum + c.credits, 0);
    const currentBalance = earned - used;
    
    if (currentBalance < credits) {
      return res.status(400).json({ 
        message: `Insufficient credits. Available: ${currentBalance}, Required: ${credits}` 
      });
    }
    
    const creditData = {
      userId,
      organizationName: user.organizationName,
      transactionType: 'used',
      credits: parseFloat(credits),
      creditType: 'Purchased',
      source: 'Emission Offset',
      description: reason || `Used ${credits} credits to offset emissions`,
      verified: true,
      transactionDate: new Date(),
    };
    
    const credit = new CarbonCredit(creditData);
    await credit.save();
    
    const newBalance = currentBalance - credits;
    
    res.status(201).json({
      success: true,
      message: `Successfully used ${credits} carbon credits for offsetting`,
      credit,
      balance: newBalance,
    });
  } catch (error) {
    console.error('Error using carbon credits:', error);
    res.status(500).json({ 
      message: 'Failed to use carbon credits',
      error: error.message,
    });
  }
};

/**
 * Get industry comparison data
 */
exports.getIndustryComparison = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Get all organizations in the same industry
    const industryOrgs = await User.find({
      role: 'Organization',
      industryType: user.industryType,
    });
    
    // Calculate emissions for each organization
    const comparisons = [];
    
    for (const org of industryOrgs) {
      const activities = await OrgActivity.find({ userId: org._id });
      const totalEmissions = activities.reduce((sum, a) => sum + a.emissionValue, 0);
      
      // Calculate intensity (per employee)
      const perEmployee = org.numberOfEmployees > 0 
        ? totalEmissions / org.numberOfEmployees 
        : 0;
      
      comparisons.push({
        orgId: org._id.toString() === userId.toString() ? 'You' : `Org-${org._id.toString().slice(-6)}`,
        isUser: org._id.toString() === userId.toString(),
        totalEmissions,
        perEmployee,
        industryType: org.industryType,
      });
    }
    
    // Sort by emissions
    comparisons.sort((a, b) => a.totalEmissions - b.totalEmissions);
    
    // Calculate industry average
    const avgEmissions = comparisons.reduce((sum, c) => sum + c.totalEmissions, 0) / comparisons.length;
    const avgPerEmployee = comparisons.reduce((sum, c) => sum + c.perEmployee, 0) / comparisons.length;
    
    res.json({
      comparisons,
      industryAverage: {
        totalEmissions: avgEmissions,
        perEmployee: avgPerEmployee,
      },
      industryType: user.industryType,
      totalOrganizations: comparisons.length,
    });
  } catch (error) {
    console.error('Error fetching industry comparison:', error);
    res.status(500).json({ 
      message: 'Failed to fetch industry comparison',
      error: error.message,
    });
  }
};

module.exports = exports;
