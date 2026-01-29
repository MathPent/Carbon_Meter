const OrgActivity = require('../models/OrgActivity');
const CarbonCredit = require('../models/CarbonCredit');
const User = require('../models/User');
const { MOCK_ORGANIZATIONS, SECTOR_BENCHMARKS, BEST_PRACTICES_CATALOG } = require('../data/mockOrganizations');
const { 
  getDemoDataForSector, 
  getAllDemoData, 
  getBenchmarksForSector, 
  getBestPractices: getDemoBestPractices,
  calculateDemoPercentile,
  getPerformanceCategory 
} = require('../../data/industryDemoData');

const ORG_COMPARE_MIN_ORGS = 3;
const USE_MOCK_DATA_FALLBACK = true; // Enable mock data for demo purposes
const ENABLE_DEMO_FALLBACK = true; // Always use demo data when sector missing or insufficient data

const getSectorFromUser = (user) => {
  return (
    user?.industryType ||
    user?.organizationType ||
    user?.organizationInfo?.industryType ||
    null
  );
};

const maskOrgName = (org) => {
  const suffix = org?._id?.toString?.().slice(-4)?.toUpperCase?.() || 'XXXX';
  return `Org-${suffix}`;
};

const roundTo = (value, decimals = 1) => {
  if (!Number.isFinite(value)) return 0;
  const p = Math.pow(10, decimals);
  return Math.round(value * p) / p;
};

const rangeLabel = (value, { unitLabel = 'tCO2e', step } = {}) => {
  if (!Number.isFinite(value) || value <= 0) {
    return { min: 0, max: 0, label: '—', midpoint: 0 };
  }

  let resolvedStep = step;
  if (!resolvedStep) {
    if (value < 10) resolvedStep = 1;
    else if (value < 50) resolvedStep = 2;
    else if (value < 200) resolvedStep = 5;
    else if (value < 1000) resolvedStep = 20;
    else resolvedStep = 50;
  }

  const min = Math.floor(value / resolvedStep) * resolvedStep;
  const max = min + resolvedStep;
  const midpoint = (min + max) / 2;
  return {
    min,
    max,
    midpoint,
    label: `${min}–${max} ${unitLabel}`,
  };
};

const getBenchmarkConfigBySector = (sector) => {
  const normalized = (sector || '').toLowerCase();
  const defaults = {
    excellentMax: 4,
    averageMax: 7,
  };

  if (normalized.includes('it') || normalized.includes('software') || normalized.includes('technology')) {
    return { excellentMax: 2, averageMax: 4 };
  }
  if (normalized.includes('health')) {
    return { excellentMax: 3, averageMax: 6 };
  }
  if (normalized.includes('education')) {
    return { excellentMax: 2.5, averageMax: 5 };
  }
  if (normalized.includes('manufact')) {
    return { excellentMax: 4, averageMax: 7 };
  }

  return defaults;
};

const benchmarkLabel = (value, cfg) => {
  if (!Number.isFinite(value) || value <= 0) return { bucket: 'unknown', label: 'Insufficient data' };
  if (value < cfg.excellentMax) return { bucket: 'excellent', label: 'Below Industry Average' };
  if (value <= cfg.averageMax) return { bucket: 'average', label: 'Industry Average' };
  return { bucket: 'high', label: 'Above Industry Average' };
};

const getBestPracticesCatalog = () => {
  return {
    Manufacturing: {
      'Electricity Consumption': [
        {
          title: 'Upgrade to IE3/IE4 energy-efficient motors',
          why: 'Motors dominate electricity use in most plants; higher efficiency cuts kWh immediately.',
          impactPct: 0.08,
        },
        {
          title: 'Optimize compressed air system (leaks + pressure)',
          why: 'Compressed air is one of the costliest utilities; leak fixes often deliver quick wins.',
          impactPct: 0.05,
        },
      ],
      'Fuel Combustion': [
        {
          title: 'Waste heat recovery on boilers/furnaces',
          why: 'Recovers usable heat from flue gases; reduces fuel required per unit output.',
          impactPct: 0.10,
        },
        {
          title: 'Tune burners and improve insulation',
          why: 'Combustion tuning and insulation reduce losses and improve thermal efficiency.',
          impactPct: 0.06,
        },
      ],
      default: [
        {
          title: 'Implement ISO 50001-style energy management',
          why: 'A structured program sustains reductions through metering, targets, and accountability.',
          impactPct: 0.05,
        },
      ],
    },
    IT: {
      'Electricity Consumption': [
        {
          title: 'Cloud optimization (rightsizing + autoscaling)',
          why: 'Overprovisioned compute drives unnecessary energy use; optimize utilization.',
          impactPct: 0.12,
        },
        {
          title: 'Server consolidation & virtualization',
          why: 'Fewer physical servers reduce energy and cooling demand in data centers.',
          impactPct: 0.10,
        },
      ],
      'Business Travel': [
        {
          title: 'Replace short-haul travel with virtual-first policy',
          why: 'Air travel is carbon intensive; policy + tooling reduce recurring emissions.',
          impactPct: 0.08,
        },
      ],
      default: [
        {
          title: 'Increase renewable electricity procurement',
          why: 'Reducing grid emission factor lowers Scope 2 emissions at scale.',
          impactPct: 0.15,
        },
      ],
    },
    Healthcare: {
      'Electricity Consumption': [
        {
          title: 'HVAC scheduling & setpoint optimization',
          why: 'Hospitals run 24/7; optimizing HVAC reduces large baseload energy use.',
          impactPct: 0.07,
        },
      ],
      default: [
        {
          title: 'Steam & heat distribution loss reduction',
          why: 'Insulation and trap maintenance reduce avoidable thermal losses.',
          impactPct: 0.06,
        },
      ],
    },
    Education: {
      'Electricity Consumption': [
        {
          title: 'LED + occupancy sensors for classrooms',
          why: 'Lighting upgrades deliver predictable reductions with short payback.',
          impactPct: 0.06,
        },
      ],
      default: [
        {
          title: 'Campus commute program (carpool + bus incentives)',
          why: 'Commuting is often the largest indirect source; incentives shift behavior.',
          impactPct: 0.05,
        },
      ],
    },
    default: {
      default: [
        {
          title: 'Metering + hotspots dashboard for top sources',
          why: 'Visibility focuses effort where emissions concentrate and prevents regression.',
          impactPct: 0.05,
        },
        {
          title: 'Supplier engagement for key purchased goods',
          why: 'Scope 3 reductions often require supplier data and joint reduction plans.',
          impactPct: 0.04,
        },
      ],
    },
  };
};

const normalizeSectorKey = (sector) => {
  const s = (sector || '').toLowerCase();
  if (s.includes('manufact')) return 'Manufacturing';
  if (s.includes('it') || s.includes('software') || s.includes('tech')) return 'IT';
  if (s.includes('health')) return 'Healthcare';
  if (s.includes('education')) return 'Education';
  return 'default';
};

const ensureOrganizationUser = async (req) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }
  if (user.role !== 'Organization') {
    const err = new Error('Access restricted to organization users');
    err.statusCode = 403;
    throw err;
  }
  return user;
};

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
    // Backward-compatible endpoint. Delegate to privacy-safe peer comparison.
    return exports.getPeerComparison(req, res);
  } catch (error) {
    console.error('Error fetching industry comparison:', error);
    res.status(500).json({ 
      message: 'Failed to fetch industry comparison',
      error: error.message,
    });
  }
};

/**
 * GET /api/org/compare/leaderboard OR /api/organization/leaderboard
 * Query:
 * - sector: string (optional; defaults to user's sector)
 * - metric: 'total' | 'perEmployee' (optional; defaults 'perEmployee')
 * ✅ NEVER RETURNS 400 - Always provides demo data fallback
 */
exports.getOrgLeaderboard = async (req, res) => {
  try {
    const user = await ensureOrganizationUser(req);
    let sector = req.query.sector || getSectorFromUser(user);
    const metric = (req.query.metric || 'perEmployee').toString();
    
    // ✅ FIX: Never return 400 for missing sector - use demo data
    let useDemo = false;
    if (!sector) {
      sector = 'IT'; // Default to IT sector for demo
      useDemo = true;
    }

    let orgUsers = await User.find({ role: 'Organization', industryType: sector }).select(
      '_id organizationName industryType numberOfEmployees'
    );

    // Use demo data if insufficient real data OR if sector was missing
    if (ENABLE_DEMO_FALLBACK && (useDemo || orgUsers.length < ORG_COMPARE_MIN_ORGS)) {
      const demoCompanies = getDemoDataForSector(sector);
      const mockOrgs = demoCompanies.map((m) => ({
        _id: `mock-${m.name.toLowerCase().replace(/\s+/g, '-')}`,
        organizationName: m.name,
        industryType: m.sector,
        numberOfEmployees: m.numberOfEmployees,
        _isMock: true,
        _mockEmissions: m.totalEmissions,
        _logo: m.logo,
      }));
      orgUsers = [...orgUsers, ...mockOrgs];
      useDemo = true;
    }

    const orgIds = orgUsers.filter((o) => !o._isMock).map((o) => o._id);

    const totals = orgIds.length > 0 ? await OrgActivity.aggregate([
      { $match: { userId: { $in: orgIds } } },
      { $group: { _id: '$userId', totalEmissions: { $sum: '$emissionValue' } } },
    ]) : [];

    const totalsMap = new Map(totals.map((t) => [t._id.toString(), t.totalEmissions]));

    const rows = orgUsers
      .map((org) => {
        const totalEmissions = org._isMock
          ? org._mockEmissions
          : (totalsMap.get(org._id.toString()) || 0);
        const employees = org.numberOfEmployees || 0;
        const perEmployee = employees > 0 ? totalEmissions / employees : 0;
        const isUser = !org._isMock && org._id.toString() === user._id.toString();
        return {
          org,
          isUser,
          totalEmissions,
          perEmployee,
        };
      })
      .filter((r) => (metric === 'perEmployee' ? r.org.numberOfEmployees > 0 : true));

    rows.sort((a, b) => {
      const aVal = metric === 'total' ? a.totalEmissions : a.perEmployee;
      const bVal = metric === 'total' ? b.totalEmissions : b.perEmployee;
      return aVal - bVal;
    });

    const count = rows.length;

    const items = rows.map((r, idx) => {
      const rank = idx + 1;
      const badge = rank <= Math.ceil(count * 0.1) ? 'Top 10%' : rank <= Math.ceil(count * 0.25) ? 'Top 25%' : null;

      return {
        rank,
        name: r.org.organizationName || 'Organization',
        organizationName: r.org.organizationName || 'Organization',
        logo: r.org._logo || null,
        isUser: r.isUser,
        sector: r.org.industryType || sector,
        totalEmissions: roundTo(r.totalEmissions, 2),
        emissionsPerEmployee: roundTo(r.perEmployee, 2),
        badge,
        _isDemo: r.org._isMock || false,
      };
    });

    res.json({
      sector,
      metric,
      totalOrganizations: count,
      items,
      demo: useDemo, // ✅ Flag to show demo badge in UI
      insufficientData: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Org leaderboard error:', error);
    // ✅ Even on error, return demo data instead of 500
    const sector = 'IT';
    const demoCompanies = getDemoDataForSector(sector);
    const items = demoCompanies.map((c, idx) => ({
      rank: idx + 1,
      name: c.name,
      organizationName: c.name,
      logo: c.logo,
      isUser: false,
      sector: c.sector,
      totalEmissions: roundTo(c.totalEmissions, 2),
      emissionsPerEmployee: roundTo(c.emissionPerEmployee, 2),
      badge: idx === 0 ? 'Top 10%' : null,
      _isDemo: true,
    }));
    
    res.json({
      sector,
      metric: 'perEmployee',
      totalOrganizations: items.length,
      items,
      demo: true,
      insufficientData: false,
      updatedAt: new Date().toISOString(),
    });
  }
};

/**
 * GET /api/org/compare/peers OR /api/organization/compare/peers
 * Returns privacy-safe peer comparison for logged-in organization.
 * ✅ NEVER RETURNS 400 - Always provides demo data fallback
 */
exports.getPeerComparison = async (req, res) => {
  try {
    const user = await ensureOrganizationUser(req);
    let sector = req.query.sector || getSectorFromUser(user);

    // ✅ FIX: Never return 400 for missing sector - use demo data
    let useDemo = false;
    if (!sector) {
      sector = 'IT'; // Default to IT sector for demo
      useDemo = true;
    }

    let orgUsers = await User.find({ role: 'Organization', industryType: sector }).select(
      '_id organizationName industryType numberOfEmployees'
    );

    // Use demo data if insufficient real data OR if sector was missing
    if (ENABLE_DEMO_FALLBACK && (useDemo || orgUsers.length < ORG_COMPARE_MIN_ORGS)) {
      const demoCompanies = getDemoDataForSector(sector);
      const mockOrgs = demoCompanies.map((m) => ({
        _id: `mock-${m.name.toLowerCase().replace(/\s+/g, '-')}`,
        organizationName: m.name,
        industryType: m.sector,
        numberOfEmployees: m.numberOfEmployees,
        _isMock: true,
        _mockEmissions: m.totalEmissions,
        _logo: m.logo,
      }));
      orgUsers = [...orgUsers, ...mockOrgs];
      useDemo = true;
    }

    const orgIds = orgUsers.filter((o) => !o._isMock).map((o) => o._id);
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Total emissions per org for last 12 months
    const yearTotals = orgIds.length > 0 ? await OrgActivity.aggregate([
      { $match: { userId: { $in: orgIds }, activityDate: { $gte: oneYearAgo, $lte: now } } },
      { $group: { _id: '$userId', totalYearEmissions: { $sum: '$emissionValue' } } },
    ]) : [];
    const yearTotalsMap = new Map(yearTotals.map((t) => [t._id.toString(), t.totalYearEmissions]));

    // Compute per-employee intensity
    const intensityRows = orgUsers
      .map((org) => {
        const totalYear = org._isMock ? org._mockEmissions : (yearTotalsMap.get(org._id.toString()) || 0);
        const employees = org.numberOfEmployees || 0;
        const perEmployeeYear = employees > 0 ? totalYear / employees : null;
        const isUser = !org._isMock && org._id.toString() === user._id.toString();
        return {
          org,
          totalYear,
          perEmployeeYear,
          isUser,
        };
      })
      .filter((r) => r.perEmployeeYear !== null);

    if (intensityRows.length === 0) {
      // ✅ Return demo data instead of insufficientData
      const demoCompanies = getDemoDataForSector(sector);
      return res.json({
        sector,
        demo: true,
        yourOrganization: {
          name: 'Your Organization',
          perEmployeeYear: 0,
          totalYear: 0,
        },
        benchmarks: {
          best: {
            name: demoCompanies[0]?.name || 'Top Performer',
            perEmployeeYear: demoCompanies[0]?.emissionPerEmployee || 0,
          },
          average: {
            perEmployeeYear: demoCompanies.reduce((sum, c) => sum + c.emissionPerEmployee, 0) / demoCompanies.length,
          },
          worst: {
            name: demoCompanies[demoCompanies.length - 1]?.name || 'Below Average',
            perEmployeeYear: demoCompanies[demoCompanies.length - 1]?.emissionPerEmployee || 0,
          },
        },
        peers: demoCompanies.slice(0, 5).map(c => ({
          name: c.name,
          logo: c.logo,
          emissionPerEmployee: c.emissionPerEmployee,
          _isDemo: true,
        })),
        monthlyTrend: [],
        insufficientData: false,
      });
    }

    const userRow = intensityRows.find((r) => r.isUser);
    
    intensityRows.sort((a, b) => a.perEmployeeYear - b.perEmployeeYear);
    const bestRow = intensityRows[0];
    const worstRow = intensityRows[intensityRows.length - 1];

    const avgPerEmployeeYear =
      intensityRows.reduce((sum, r) => sum + r.perEmployeeYear, 0) / intensityRows.length;
    const avgTotalYear = intensityRows.reduce((sum, r) => sum + r.totalYear, 0) / intensityRows.length;

    // Monthly trend (your org): last 6 months
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const yourMonthly = userRow ? await OrgActivity.aggregate([
      { $match: { userId: user._id, activityDate: { $gte: sixMonthsAgo, $lte: now } } },
      {
        $group: {
          _id: { year: { $year: '$activityDate' }, month: { $month: '$activityDate' } },
          totalEmissions: { $sum: '$emissionValue' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]) : [];

    const yourMonthlyTrend = yourMonthly.map((m) => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      total: roundTo(m.totalEmissions, 2),
    }));

    // Sector monthly average per org (privacy-safe)
    const sectorMonthlyAvg = orgIds.length > 0 ? await OrgActivity.aggregate([
      { $match: { userId: { $in: orgIds }, activityDate: { $gte: sixMonthsAgo, $lte: now } } },
      {
        $group: {
          _id: {
            year: { $year: '$activityDate' },
            month: { $month: '$activityDate' },
            userId: '$userId',
          },
          totalEmissions: { $sum: '$emissionValue' },
        },
      },
      {
        $group: {
          _id: { year: '$_id.year', month: '$_id.month' },
          avgEmissions: { $avg: '$totalEmissions' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]) : [];

    const sectorMonthlyTrend = sectorMonthlyAvg.map((m) => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      total: roundTo(m.avgEmissions, 2),
    }));

    // ✅ Build peer list with logos
    const topPeers = intensityRows.slice(0, 5).map(r => ({
      name: r.org.organizationName || 'Peer Org',
      logo: r.org._logo || null,
      emissionPerEmployee: roundTo(r.perEmployeeYear, 2),
      _isDemo: r.org._isMock || false,
    }));

    res.json({
      sector,
      demo: useDemo, // ✅ Flag for demo badge
      insufficientData: false,
      yourOrganization: userRow ? {
        name: user.organizationName || 'Your Organization',
        totalYearEmissions: roundTo(userRow.totalYear, 2),
        perEmployeeYear: roundTo(userRow.perEmployeeYear, 2),
        employees: user.numberOfEmployees || 0,
        monthlyTrend: yourMonthlyTrend,
      } : {
        name: 'Your Organization',
        totalYearEmissions: 0,
        perEmployeeYear: 0,
        employees: 0,
        monthlyTrend: [],
      },
      benchmarks: {
        best: {
          name: bestRow.org.organizationName || 'Top Performer',
          perEmployeeYear: roundTo(bestRow.perEmployeeYear, 2),
        },
        average: {
          perEmployeeYear: roundTo(avgPerEmployeeYear, 2),
        },
        worst: {
          name: worstRow.org.organizationName || 'Below Average',
          perEmployeeYear: roundTo(worstRow.perEmployeeYear, 2),
        },
      },
      peers: topPeers,
      sectorMonthlyTrend,
      totalOrganizations: orgUsers.length,
    });
  } catch (error) {
    console.error('Peer comparison error:', error);
    // ✅ Return demo data instead of 500
    const sector = 'IT';
    const demoCompanies = getDemoDataForSector(sector);
    res.json({
      sector,
      demo: true,
      insufficientData: false,
      yourOrganization: {
        name: 'Your Organization',
        totalYearEmissions: 0,
        perEmployeeYear: 0,
        employees: 0,
        monthlyTrend: [],
      },
      benchmarks: {
        best: {
          name: demoCompanies[0]?.name || 'Top Performer',
          perEmployeeYear: demoCompanies[0]?.emissionPerEmployee || 0,
        },
        average: {
          perEmployeeYear: demoCompanies.reduce((sum, c) => sum + c.emissionPerEmployee, 0) / demoCompanies.length,
        },
        worst: {
          name: demoCompanies[demoCompanies.length - 1]?.name || 'Below Average',
          perEmployeeYear: demoCompanies[demoCompanies.length - 1]?.emissionPerEmployee || 0,
        },
      },
      peers: demoCompanies.slice(0, 5).map(c => ({
        name: c.name,
        logo: c.logo,
        emissionPerEmployee: c.emissionPerEmployee,
        _isDemo: true,
      })),
      sectorMonthlyTrend: [],
      totalOrganizations: demoCompanies.length,
    });
  }
};

/**
 * GET /api/org/compare/benchmarks OR /api/organization/benchmarks
 * Returns sector benchmark thresholds and where the org falls.
 * ✅ NEVER RETURNS 400 - Always provides demo data fallback
 */
exports.getSectorBenchmarks = async (req, res) => {
  try {
    const user = await ensureOrganizationUser(req);
    let sector = req.query.sector || getSectorFromUser(user);
    
    // ✅ FIX: Never return 400 for missing sector - use demo data
    let useDemo = false;
    if (!sector) {
      sector = 'IT'; // Default to IT sector for demo
      useDemo = true;
    }

    const cfg = getBenchmarkConfigBySector(sector);
    const demoBenchmarks = getBenchmarksForSector(sector);
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const yearTotalAgg = await OrgActivity.aggregate([
      { $match: { userId: user._id, activityDate: { $gte: oneYearAgo, $lte: now } } },
      { $group: { _id: '$userId', totalYearEmissions: { $sum: '$emissionValue' } } },
    ]);

    const totalYear = yearTotalAgg?.[0]?.totalYearEmissions || 0;
    const employees = user.numberOfEmployees || 0;
    const perEmployeeYear = employees > 0 ? totalYear / employees : 0;
    const label = benchmarkLabel(perEmployeeYear, cfg);

    // ✅ Always provide industry data from demo benchmarks
    const industryData = demoBenchmarks ? {
      excellent: demoBenchmarks.excellent,
      good: demoBenchmarks.good,
      average: demoBenchmarks.average,
      needsImprovement: demoBenchmarks.needsImprovement,
    } : null;

    res.json({
      sector,
      demo: useDemo || !(employees > 0 && totalYear > 0), // ✅ Flag for demo badge
      benchmarks: {
        excellent: `< ${cfg.excellentMax} tCO2e/employee/year`,
        average: `${cfg.excellentMax}–${cfg.averageMax} tCO2e/employee/year`,
        high: `> ${cfg.averageMax} tCO2e/employee/year`,
        excellentMax: cfg.excellentMax,
        averageMax: cfg.averageMax,
      },
      industryData,
      yourOrg: {
        perEmployeeYear: roundTo(perEmployeeYear, 2),
        employees,
        label: label.label,
        bucket: label.bucket,
      },
      insufficientData: false, // ✅ Never show insufficient data
    });
  } catch (error) {
    console.error('Sector benchmarks error:', error);
    // ✅ Return demo data instead of 500
    const sector = 'IT';
    const demoBenchmarks = getBenchmarksForSector(sector);
    res.json({
      sector,
      demo: true,
      benchmarks: {
        excellent: `< 2.0 tCO2e/employee/year`,
        average: `2.0–3.0 tCO2e/employee/year`,
        high: `> 3.0 tCO2e/employee/year`,
        excellentMax: 2.0,
        averageMax: 3.0,
      },
      industryData: demoBenchmarks,
      yourOrg: {
        perEmployeeYear: 0,
        employees: 0,
        label: 'Insufficient data',
        bucket: 'unknown',
      },
      insufficientData: false,
    });
  }
};

/**
 * GET /api/org/compare/percentile OR /api/organization/compare/percentile
 * ✅ NEVER RETURNS 400 - Always provides demo data fallback
 */
exports.getSectorPercentile = async (req, res) => {
  try {
    const user = await ensureOrganizationUser(req);
    let sector = req.query.sector || getSectorFromUser(user);
    
    // ✅ FIX: Never return 400 for missing sector - use demo data
    let useDemo = false;
    if (!sector) {
      sector = 'IT'; // Default to IT sector for demo
      useDemo = true;
    }

    let orgUsers = await User.find({ role: 'Organization', industryType: sector }).select(
      '_id numberOfEmployees'
    );

    // Use demo data if insufficient real data OR if sector was missing
    if (ENABLE_DEMO_FALLBACK && (useDemo || orgUsers.length < ORG_COMPARE_MIN_ORGS)) {
      const demoCompanies = getDemoDataForSector(sector);
      const mockOrgs = demoCompanies.map((m) => ({
        _id: `mock-${m.name.toLowerCase().replace(/\s+/g, '-')}`,
        numberOfEmployees: m.numberOfEmployees,
        _isMock: true,
        _mockEmissions: m.totalEmissions,
      }));
      orgUsers = [...orgUsers, ...mockOrgs];
      useDemo = true;
    }

    const orgIds = orgUsers.filter((o) => !o._isMock).map((o) => o._id);
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const yearTotals = orgIds.length > 0 ? await OrgActivity.aggregate([
      { $match: { userId: { $in: orgIds }, activityDate: { $gte: oneYearAgo, $lte: now } } },
      { $group: { _id: '$userId', totalYearEmissions: { $sum: '$emissionValue' } } },
    ]) : [];
    const totalsMap = new Map(yearTotals.map((t) => [t._id.toString(), t.totalYearEmissions]));

    const intensities = orgUsers
      .map((o) => {
        const totalYear = o._isMock ? o._mockEmissions : (totalsMap.get(o._id.toString()) || 0);
        const emp = o.numberOfEmployees || 0;
        if (!(emp > 0) || !(totalYear > 0)) return null;
        return {
          userId: o._id.toString(),
          perEmployeeYear: totalYear / emp,
          _isMock: o._isMock || false,
        };
      })
      .filter(Boolean);

    const your = intensities.find((x) => !x._isMock && x.userId === user._id.toString());
    
    // ✅ Calculate percentile even without user data using demo companies
    let percentile, color, statement;
    if (!your && useDemo) {
      // User has no data, calculate demo percentile assuming average performance
      const avgEmission = intensities.reduce((sum, x) => sum + x.perEmployeeYear, 0) / intensities.length;
      percentile = 50; // Middle of the pack
      color = 'yellow';
      statement = `Add your emission data to see your ranking in ${sector} sector.`;
    } else if (!your) {
      // No user data and no demo - still return something
      percentile = 50;
      color = 'yellow';
      statement = `Add emission activity and employee count to calculate your percentile ranking.`;
    } else {
      const N = intensities.length;
      const moreThanYou = intensities.filter((x) => x.perEmployeeYear > your.perEmployeeYear).length;
      percentile = Math.round((moreThanYou / N) * 100);
      
      if (percentile > 70) color = 'green';
      else if (percentile >= 40) color = 'yellow';
      else color = 'red';
      
      statement = `You are better than ${percentile}% of organizations in ${sector}.`;
    }

    const category = getPerformanceCategory(percentile);

    res.json({
      sector,
      percentile,
      category, // ✅ Added category for UI display
      color,
      demo: useDemo, // ✅ Flag for demo badge
      totalOrganizationsConsidered: intensities.length,
      insufficientData: false, // ✅ Never show insufficient data
      statement,
    });
  } catch (error) {
    console.error('Sector percentile error:', error);
    // ✅ Return demo data instead of 500
    res.json({
      sector: 'IT',
      percentile: 50,
      category: 'Average',
      color: 'yellow',
      demo: true,
      totalOrganizationsConsidered: 5,
      insufficientData: false,
      statement: 'Add your emission data to see your ranking in IT sector.',
    });
  }
};

/**
 * GET /api/org/compare/best-practices OR /api/organization/best-practices
 * ✅ NEVER RETURNS 400 - Always provides demo data fallback
 */
exports.getBestPractices = async (req, res) => {
  try {
    const user = await ensureOrganizationUser(req);
    let sector = req.query.sector || getSectorFromUser(user);
    
    // ✅ FIX: Never return 400 for missing sector - use demo data
    let useDemo = false;
    if (!sector) {
      sector = 'IT'; // Default to IT sector for demo
      useDemo = true;
    }

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const topCategories = await OrgActivity.aggregate([
      { $match: { userId: user._id, activityDate: { $gte: oneYearAgo, $lte: now } } },
      { $group: { _id: '$category', total: { $sum: '$emissionValue' } } },
      { $sort: { total: -1 } },
      { $limit: 3 },
    ]);

    const totalYearAgg = await OrgActivity.aggregate([
      { $match: { userId: user._id, activityDate: { $gte: oneYearAgo, $lte: now } } },
      { $group: { _id: '$userId', total: { $sum: '$emissionValue' } } },
    ]);
    const totalYear = totalYearAgg?.[0]?.total || 0;

    // ✅ Determine emission level for best practices
    let emissionLevel = 'medium';
    if (totalYear > 0) {
      const employees = user.numberOfEmployees || 1;
      const perEmployee = totalYear / employees;
      const benchmarks = getBenchmarksForSector(sector);
      if (perEmployee > benchmarks.average) {
        emissionLevel = 'high';
      } else if (perEmployee < benchmarks.good) {
        emissionLevel = 'low';
      }
      useDemo = false;
    } else {
      useDemo = true;
      emissionLevel = 'medium'; // Default for demo
    }

    // ✅ Get best practices from new demo data structure
    const practices = getDemoBestPractices(sector, emissionLevel);
    
    // Format recommendations with icons
    const recommendations = practices.slice(0, 5).map((practice, idx) => ({
      title: practice,
      icon: ['💡', '🌱', '⚡', '♻️', '🏭'][idx] || '✓',
      category: emissionLevel === 'high' ? 'Priority Action' : emissionLevel === 'low' ? 'Maintain Excellence' : 'Improvement',
    }));

    res.json({
      sector,
      demo: useDemo, // ✅ Flag for demo badge
      emissionLevel,
      primaryCategory: topCategories?.[0]?._id || 'General',
      recommendations,
      insufficientData: false, // ✅ Never show insufficient data
      totalPractices: practices.length,
    });
  } catch (error) {
    console.error('Best practices error:', error);
    // ✅ Return demo data instead of 500
    const practices = getDemoBestPractices('IT', 'medium');
    res.json({
      sector: 'IT',
      demo: true,
      emissionLevel: 'medium',
      primaryCategory: 'General',
      recommendations: practices.slice(0, 5).map((practice, idx) => ({
        title: practice,
        icon: ['💡', '🌱', '⚡', '♻️', '🏭'][idx] || '✓',
        category: 'Improvement',
      })),
      insufficientData: false,
      totalPractices: practices.length,
    });
  }
};

module.exports = exports;
