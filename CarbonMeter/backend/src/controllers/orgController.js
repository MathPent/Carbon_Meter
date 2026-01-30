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
    const userId = req.user.userId || req.user.id;
    
    // Get user details for organization info
    const user = await User.findById(userId).select('organizationName organizationId sector employeeCount annualRevenue location industryType numberOfEmployees');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const organizationId = user.organizationId || userId;
    
    // Get all activities for this organization (check both userId and organizationId)
    const activities = await OrgActivity.find({
      $or: [
        { userId: userId },
        { organizationId: organizationId }
      ]
    }).sort({ activityDate: -1 });
    
    // Calculate total emissions by scope
    const scope1Total = activities
      .filter(a => a.scope === 'Scope 1')
      .reduce((sum, a) => sum + (a.emissionValue || a.totalEmissions || 0), 0);
    
    const scope2Total = activities
      .filter(a => a.scope === 'Scope 2')
      .reduce((sum, a) => sum + (a.emissionValue || a.totalEmissions || 0), 0);
    
    const scope3Total = activities
      .filter(a => a.scope === 'Scope 3')
      .reduce((sum, a) => sum + (a.emissionValue || a.totalEmissions || 0), 0);
    
    const totalEmissions = scope1Total + scope2Total + scope3Total;
    
    // Calculate intensity metrics
    const employeeCount = user.employeeCount || user.numberOfEmployees || 0;
    const revenue = user.annualRevenue || 0;
    
    const perEmployee = employeeCount > 0 
      ? totalEmissions / employeeCount 
      : 0;
    
    const perRevenue = revenue > 0 
      ? totalEmissions / revenue * 1000000 // per million INR
      : 0;
    
    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await OrgActivity.aggregate([
      {
        $match: {
          $or: [
            { userId: userId },
            { organizationId: organizationId }
          ],
          activityDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$activityDate' },
            month: { $month: '$activityDate' },
          },
          totalEmissions: { $sum: { $ifNull: ['$emissionValue', '$totalEmissions'] } },
          scope1: {
            $sum: {
              $cond: [{ $eq: ['$scope', 'Scope 1'] }, { $ifNull: ['$emissionValue', '$totalEmissions'] }, 0],
            },
          },
          scope2: {
            $sum: {
              $cond: [{ $eq: ['$scope', 'Scope 2'] }, { $ifNull: ['$emissionValue', '$totalEmissions'] }, 0],
            },
          },
          scope3: {
            $sum: {
              $cond: [{ $eq: ['$scope', 'Scope 3'] }, { $ifNull: ['$emissionValue', '$totalEmissions'] }, 0],
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
        industryType: user.industryType || user.sector,
        employees: employeeCount,
        revenue: revenue,
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
 * Save comprehensive organization emission calculation
 */
exports.saveCalculation = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await User.findById(userId).select('organizationName organizationId sector employeeCount');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { timePeriod, startDate, endDate, scope1, scope2, scope3, totalEmissions, perEmployee, perRevenue, rawData } = req.body;

    const organizationId = user.organizationId || userId;

    // Create activities for each scope with emissions
    const activities = [];

    // Scope 1 Activity
    if (scope1 && scope1 > 0) {
      const scope1Activity = new OrgActivity({
        userId,
        organizationId,
        organizationName: user.organizationName,
        activityDate: endDate ? new Date(endDate) : new Date(),
        reportingPeriod: timePeriod || 'monthly',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        scope: 'Scope 1',
        category: 'Company Vehicles',
        activityType: 'Fuel Combustion',
        description: `Scope 1 emissions - ${timePeriod} calculation`,
        emissionValue: scope1,
        scope1Emissions: scope1,
        scope2Emissions: 0,
        scope3Emissions: 0,
        totalEmissions: scope1,
        unit: 'tCO2e',
        calculationMethod: 'Comprehensive',
        source: 'Organization Calculator',
        verified: false,
      });
      await scope1Activity.save();
      activities.push(scope1Activity);
    }

    // Scope 2 Activity
    if (scope2 && scope2 > 0) {
      const scope2Activity = new OrgActivity({
        userId,
        organizationId,
        organizationName: user.organizationName,
        activityDate: endDate ? new Date(endDate) : new Date(),
        reportingPeriod: timePeriod || 'monthly',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        scope: 'Scope 2',
        category: 'Electricity Consumption',
        activityType: 'Energy Use',
        description: `Scope 2 emissions - ${timePeriod} calculation`,
        emissionValue: scope2,
        scope1Emissions: 0,
        scope2Emissions: scope2,
        scope3Emissions: 0,
        totalEmissions: scope2,
        unit: 'tCO2e',
        calculationMethod: 'Comprehensive',
        source: 'Organization Calculator',
        verified: false,
      });
      await scope2Activity.save();
      activities.push(scope2Activity);
    }

    // Scope 3 Activity
    if (scope3 && scope3 > 0) {
      const scope3Activity = new OrgActivity({
        userId,
        organizationId,
        organizationName: user.organizationName,
        activityDate: endDate ? new Date(endDate) : new Date(),
        reportingPeriod: timePeriod || 'monthly',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        scope: 'Scope 3',
        category: 'Business Travel',
        activityType: 'Transportation',
        description: `Scope 3 emissions - ${timePeriod} calculation`,
        emissionValue: scope3,
        scope1Emissions: 0,
        scope2Emissions: 0,
        scope3Emissions: scope3,
        totalEmissions: scope3,
        unit: 'tCO2e',
        calculationMethod: 'Comprehensive',
        source: 'Organization Calculator',
        verified: false,
      });
      await scope3Activity.save();
      activities.push(scope3Activity);
    }

    // Update user's employee count if provided in rawData
    if (rawData && rawData.numberOfEmployees) {
      user.employeeCount = parseInt(rawData.numberOfEmployees);
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Calculation saved successfully',
      activities,
      totalEmissions,
      breakdown: { scope1, scope2, scope3 },
    });
  } catch (error) {
    console.error('Error saving calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save calculation',
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

/**
 * POST /api/org/prediction
 * Get ML-based emission prediction for organization
 * Integrates with Python ML API
 */
exports.getOrganizationPrediction = async (req, res) => {
  try {
    const user = await ensureOrganizationUser(req);
    const sector = getSectorFromUser(user) || 'Technology';
    const axios = require('axios');
    
    // Get historical emission data (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const activities = await OrgActivity.find({
      userId: user._id,
      activityDate: { $gte: ninetyDaysAgo }
    }).sort({ activityDate: 1 });
    
    // Aggregate daily emissions
    const dailyEmissions = {};
    activities.forEach(activity => {
      const date = activity.activityDate.toISOString().split('T')[0];
      dailyEmissions[date] = (dailyEmissions[date] || 0) + (activity.emissionValue || 0);
    });
    
    const emission_history = Object.values(dailyEmissions);
    const employee_count = user.numberOfEmployees || 100;
    
    // Prepare request payload for ML API
    const mlPayload = {
      organizationId: user._id.toString(),
      sector: sector,
      emission_history: emission_history,
      employee_count: employee_count,
      revenue: 0,  // Optional field
      period: new Date().toISOString().slice(0, 7)  // YYYY-MM format
    };
    
    try {
      // Call Python ML API
      const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';
      const mlResponse = await axios.post(`${ML_API_URL}/predict/organization`, mlPayload, {
        timeout: 5000
      });
      
      // Save prediction to database
      const predictionDoc = {
        organizationId: user._id,
        period: mlPayload.period,
        predicted_emission: mlResponse.data.predicted_emission,
        trend: mlResponse.data.trend,
        confidence: mlResponse.data.confidence,
        benchmark_percentile: mlResponse.data.benchmark_percentile,
        source: mlResponse.data.source,
        demo: mlResponse.data.demo || false,
        createdAt: new Date()
      };
      
      // Return prediction response
      res.json({
        success: true,
        prediction: mlResponse.data.predicted_emission,
        trend: mlResponse.data.trend,
        confidence: mlResponse.data.confidence,
        benchmark_percentile: mlResponse.data.benchmark_percentile || 50,
        period: mlPayload.period,
        historical_days: emission_history.length,
        source: mlResponse.data.source,
        demo: mlResponse.data.demo || false,
        message: mlResponse.data.message
      });
      
    } catch (mlError) {
      console.error('ML API error:', mlError.message);
      
      // Fallback: Use simple average-based prediction
      const avgEmission = emission_history.length > 0
        ? emission_history.reduce((sum, val) => sum + val, 0) / emission_history.length
        : 100.0;
      
      const trend = emission_history.length >= 3
        ? (emission_history[emission_history.length - 1] > emission_history[emission_history.length - 3] * 1.1
          ? 'increasing'
          : emission_history[emission_history.length - 1] < emission_history[emission_history.length - 3] * 0.9
          ? 'decreasing'
          : 'stable')
        : 'stable';
      
      res.json({
        success: true,
        prediction: Math.round(avgEmission * 1.05 * 100) / 100,  // 5% growth assumption
        trend: trend,
        confidence: 0.65,
        benchmark_percentile: 50,
        period: mlPayload.period,
        historical_days: emission_history.length,
        source: 'Fallback Estimation',
        demo: true,
        message: 'ML service unavailable - using fallback calculation'
      });
    }
    
  } catch (error) {
    console.error('Organization prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate prediction',
      message: error.message
    });
  }
};

/**
 * GET /api/org/benchmarks
 * Get sector benchmarks and industry standards
 */
exports.getBenchmarks = async (req, res) => {
  try {
    const user = await ensureOrganizationUser(req);
    const sector = getSectorFromUser(user) || 'Technology';
    
    // Get benchmarks from demo data
    const benchmarks = getBenchmarksForSector(sector);
    
    // Get current organization performance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activities = await OrgActivity.find({
      userId: user._id,
      activityDate: { $gte: thirtyDaysAgo }
    });
    
    const totalEmissions = activities.reduce((sum, act) => sum + (act.emissionValue || 0), 0);
    const employees = user.numberOfEmployees || 1;
    const emissionsPerEmployee = totalEmissions / employees;
    
    // Industry leaders data
    const industryLeaders = [
      { name: 'Tata Group', sector: sector, emissions_per_employee: benchmarks.excellent * 0.8, logo: 'tata' },
      { name: 'Reliance Industries', sector: sector, emissions_per_employee: benchmarks.excellent * 0.9, logo: 'reliance' },
      { name: 'Infosys', sector: sector, emissions_per_employee: benchmarks.good * 0.85, logo: 'infosys' },
      { name: 'Wipro', sector: sector, emissions_per_employee: benchmarks.good * 0.95, logo: 'wipro' },
      { name: 'Adani Group', sector: sector, emissions_per_employee: benchmarks.average * 0.9, logo: 'adani' }
    ];
    
    res.json({
      sector: sector,
      your_performance: {
        emissions_per_employee: Math.round(emissionsPerEmployee * 100) / 100,
        total_emissions: Math.round(totalEmissions * 100) / 100,
        employees: employees
      },
      benchmarks: {
        excellent: benchmarks.excellent,
        good: benchmarks.good,
        average: benchmarks.average,
        below_average: benchmarks.poor
      },
      industry_leaders: industryLeaders,
      demo: activities.length === 0
    });
    
  } catch (error) {
    console.error('Benchmarks error:', error);
    res.status(500).json({
      error: 'Failed to fetch benchmarks',
      message: error.message
    });
  }
};

/**
 * GET /api/org/peers
 * Get peer organization comparison
 */
exports.getPeers = async (req, res) => {
  try {
    const user = await ensureOrganizationUser(req);
    const sector = getSectorFromUser(user) || 'Technology';
    
    // Get organization's emissions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activities = await OrgActivity.find({
      userId: user._id,
      activityDate: { $gte: thirtyDaysAgo }
    });
    
    const yourEmissions = activities.reduce((sum, act) => sum + (act.emissionValue || 0), 0);
    const yourEmployees = user.numberOfEmployees || 1;
    const yourPerEmployee = yourEmissions / yourEmployees;
    
    // Generate peer comparison data
    const benchmarks = getBenchmarksForSector(sector);
    
    const peerCompanies = [
      { 
        name: 'Tata Consultancy Services',
        sector: sector,
        emissions: benchmarks.excellent * yourEmployees * 0.85,
        emissions_per_employee: benchmarks.excellent * 0.85,
        employees: yourEmployees,
        trend: 'decreasing',
        logo: 'tata'
      },
      { 
        name: 'Infosys Limited',
        sector: sector,
        emissions: benchmarks.good * yourEmployees * 0.9,
        emissions_per_employee: benchmarks.good * 0.9,
        employees: yourEmployees,
        trend: 'stable',
        logo: 'infosys'
      },
      { 
        name: 'Wipro Technologies',
        sector: sector,
        emissions: benchmarks.good * yourEmployees * 1.05,
        emissions_per_employee: benchmarks.good * 1.05,
        employees: yourEmployees,
        trend: 'decreasing',
        logo: 'wipro'
      },
      { 
        name: 'HCL Technologies',
        sector: sector,
        emissions: benchmarks.average * yourEmployees * 0.95,
        emissions_per_employee: benchmarks.average * 0.95,
        employees: yourEmployees,
        trend: 'stable',
        logo: 'hcl'
      },
      { 
        name: 'Tech Mahindra',
        sector: sector,
        emissions: benchmarks.average * yourEmployees * 1.1,
        emissions_per_employee: benchmarks.average * 1.1,
        employees: yourEmployees,
        trend: 'increasing',
        logo: 'techmahindra'
      }
    ];
    
    // Add your organization
    peerCompanies.unshift({
      name: user.organizationName || 'Your Organization',
      sector: sector,
      emissions: yourEmissions,
      emissions_per_employee: yourPerEmployee,
      employees: yourEmployees,
      trend: 'stable',
      is_you: true
    });
    
    // Sort by emissions per employee
    peerCompanies.sort((a, b) => a.emissions_per_employee - b.emissions_per_employee);
    
    // Calculate rank
    const yourRank = peerCompanies.findIndex(p => p.is_you) + 1;
    
    res.json({
      sector: sector,
      your_rank: yourRank,
      total_peers: peerCompanies.length,
      peers: peerCompanies.map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        sector: p.sector,
        total_emissions: Math.round(p.emissions * 100) / 100,
        emissions_per_employee: Math.round(p.emissions_per_employee * 100) / 100,
        employees: p.employees,
        trend: p.trend,
        is_you: p.is_you || false,
        logo: p.logo
      })),
      demo: activities.length === 0
    });
    
  } catch (error) {
    console.error('Peers error:', error);
    res.status(500).json({
      error: 'Failed to fetch peer comparison',
      message: error.message
    });
  }
};

/**
 * Check for missing emission data days
 * Identifies gaps in daily activity logging for prediction
 */
exports.checkMissingData = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    const user = await User.findById(userId).select('accountType organizationId sector');
    
    const accountType = (user?.accountType || '').toLowerCase();
    if (accountType && accountType !== 'organization') {
      return res.json({
        success: true,
        organizationId: user?.organizationId || userId,
        sector: user?.sector || 'Manufacturing',
        period: '90 days',
        totalDays: 90,
        daysWithData: 0,
        missingDays: [],
        totalMissing: 0,
        dataCompleteness: '0.0',
        message: 'Missing data checks are available for organization accounts only.'
      });
    }

    const organizationId = user.organizationId || userId;

    // Get all activities in the last 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    const activities = await OrgActivity.find({
      organizationId,
      createdAt: { $gte: startDate }
    }).select('createdAt');

    // Create set of dates with data
    const datesWithData = new Set(
      activities.map(a => a.createdAt.toISOString().split('T')[0])
    );

    // Find missing dates
    const missingDays = [];
    const currentDate = new Date(startDate);
    const today = new Date();
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!datesWithData.has(dateStr)) {
        missingDays.push(dateStr);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      organizationId,
      sector: user.sector,
      period: '90 days',
      totalDays: 90,
      daysWithData: datesWithData.size,
      missingDays: missingDays.slice(0, 30), // Return max 30 for display
      totalMissing: missingDays.length,
      dataCompleteness: ((datesWithData.size / 90) * 100).toFixed(1)
    });

  } catch (error) {
    console.error('Check missing data error:', error);
    res.status(500).json({
      error: 'Failed to check missing data',
      message: error.message
    });
  }
};

/**
 * Fill missing emission data with ML predictions
 * Uses Python ML API to predict and fill gaps in historical data
 */
exports.fillMissingData = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    const user = await User.findById(userId).select('accountType organizationId sector employeeCount revenue');
    
    const accountType = (user?.accountType || '').toLowerCase();
    if (accountType && accountType !== 'organization') {
      return res.json({
        success: true,
        organizationId: user?.organizationId || userId,
        filledDays: 0,
        predictions: [],
        message: 'Missing data fill is available for organization accounts only.'
      });
    }

    const organizationId = user.organizationId || userId;
    const sector = user.sector || 'Manufacturing'; // Default to Manufacturing

    // Get emission history for last 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    const activities = await OrgActivity.find({
      organizationId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    if (activities.length < 7) {
      return res.status(400).json({
        error: 'Insufficient data',
        message: 'Need at least 7 days of historical data to generate predictions'
      });
    }

    // Get dates with data
    const datesWithData = new Set(
      activities.map(a => a.createdAt.toISOString().split('T')[0])
    );

    // Find missing dates
    const missingDates = [];
    const currentDate = new Date(startDate);
    const today = new Date();
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!datesWithData.has(dateStr)) {
        missingDates.push(dateStr);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (missingDates.length === 0) {
      return res.json({
        success: true,
        message: 'No missing data to fill',
        filled: 0
      });
    }

    // Calculate emission history
    const emissionHistory = activities.map(a => a.totalEmissions || 0);
    const avgEmission = emissionHistory.reduce((a, b) => a + b, 0) / emissionHistory.length;

    // Call ML API for each missing date (batch process)
    let filledCount = 0;
    const predictions = [];

    try {
      // Call Python ML API
      const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';
      const mlResponse = await axios.post(`${ML_API_URL}/predict/organization`, {
        organizationId: organizationId.toString(),
        sector: sector,
        emission_history: emissionHistory.slice(-30), // Last 30 days
        employee_count: user.employeeCount || 100,
        revenue: user.revenue || 1000000,
        period: 'missing-days'
      }, {
        timeout: 10000
      });

      const predictedEmission = mlResponse.data.predicted_emission || avgEmission;

      // Fill missing dates with prediction
      for (const dateStr of missingDates.slice(0, 30)) { // Limit to 30 dates
        const newActivity = new OrgActivity({
          organizationId,
          date: new Date(dateStr),
          activityType: 'Predicted',
          scope: 'All Scopes',
          totalEmissions: predictedEmission,
          scope1Emissions: predictedEmission * 0.3,
          scope2Emissions: predictedEmission * 0.4,
          scope3Emissions: predictedEmission * 0.3,
          description: `AI-predicted emission for missing data (${sector} sector)`,
          source: 'ML Prediction',
          isPrediction: true,
          predictionConfidence: mlResponse.data.confidence || 0.7
        });

        await newActivity.save();
        filledCount++;
        predictions.push({
          date: dateStr,
          predicted_emission: predictedEmission,
          source: 'XGBoost ML Model'
        });
      }

    } catch (mlError) {
      console.error('ML API error, using fallback:', mlError.message);
      
      // Fallback: Use historical average
      for (const dateStr of missingDates.slice(0, 30)) {
        const newActivity = new OrgActivity({
          organizationId,
          date: new Date(dateStr),
          activityType: 'Predicted',
          scope: 'All Scopes',
          totalEmissions: avgEmission,
          scope1Emissions: avgEmission * 0.3,
          scope2Emissions: avgEmission * 0.4,
          scope3Emissions: avgEmission * 0.3,
          description: `Statistical prediction for missing data (${sector} sector)`,
          source: 'Statistical Fallback',
          isPrediction: true,
          predictionConfidence: 0.6
        });

        await newActivity.save();
        filledCount++;
        predictions.push({
          date: dateStr,
          predicted_emission: avgEmission,
          source: 'Statistical Average'
        });
      }
    }

    res.json({
      success: true,
      message: `Filled ${filledCount} missing days with ML predictions`,
      filled: filledCount,
      totalMissing: missingDates.length,
      predictions: predictions,
      sector: sector,
      method: predictions[0]?.source || 'Unknown'
    });

  } catch (error) {
    console.error('Fill missing data error:', error);
    res.status(500).json({
      error: 'Failed to fill missing data',
      message: error.message
    });
  }
};

module.exports = exports;
