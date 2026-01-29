const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const auth = require('../middleware/auth');

// All routes require authentication
// Routes will be prefixed with /api/org

/**
 * @route   GET /api/org/dashboard
 * @desc    Get organization dashboard statistics
 * @access  Private (Organization users only)
 */
router.get('/dashboard', auth, orgController.getDashboardStats);

/**
 * @route   POST /api/org/calculate
 * @desc    Calculate emissions from input data
 * @access  Private
 */
router.post('/calculate', auth, orgController.calculateEmissions);

/**
 * @route   POST /api/org/save-calculation
 * @desc    Save comprehensive emission calculation
 * @access  Private
 */
router.post('/save-calculation', auth, orgController.saveCalculation);

/**
 * @route   POST /api/org/activities
 * @desc    Log a new emission activity
 * @access  Private
 */
router.post('/activities', auth, orgController.logActivity);

/**
 * @route   GET /api/org/activities
 * @desc    Get all activities for the organization
 * @access  Private
 */
router.get('/activities', auth, orgController.getActivities);

/**
 * @route   GET /api/org/analytics
 * @desc    Get analytics data (trends, breakdowns)
 * @access  Private
 */
router.get('/analytics', auth, orgController.getAnalytics);

/**
 * @route   GET /api/org/carbon-credits
 * @desc    Get carbon credit balance and transactions
 * @access  Private
 */
router.get('/carbon-credits', auth, orgController.getCarbonCredits);

/**
 * @route   POST /api/org/carbon-credits
 * @desc    Add a carbon credit transaction
 * @access  Private
 */
router.post('/carbon-credits', auth, orgController.addCarbonCredit);

/**
 * @route   POST /api/org/carbon-credits/earn
 * @desc    Earn carbon credits from verified reduction projects
 * @access  Private
 */
router.post('/carbon-credits/earn', auth, orgController.earnCarbonCredits);

/**
 * @route   POST /api/org/carbon-credits/purchase
 * @desc    Purchase carbon credits from market
 * @access  Private
 */
router.post('/carbon-credits/purchase', auth, orgController.purchaseCarbonCredits);

/**
 * @route   POST /api/org/carbon-credits/use
 * @desc    Use carbon credits to offset emissions
 * @access  Private
 */
router.post('/carbon-credits/use', auth, orgController.useCarbonCredits);

/**
 * @route   GET /api/org/comparison
 * @desc    Get industry comparison data
 * @access  Private
 */
router.get('/comparison', auth, orgController.getIndustryComparison);

/**
 * Organization Compare (Benchmarking & Leaderboard)
 */
router.get('/compare/leaderboard', auth, orgController.getOrgLeaderboard);
router.get('/compare/peers', auth, orgController.getPeerComparison);
router.get('/compare/benchmarks', auth, orgController.getSectorBenchmarks);
router.get('/compare/percentile', auth, orgController.getSectorPercentile);
router.get('/compare/best-practices', auth, orgController.getBestPractices);

/**
 * @route   POST /api/org/prediction
 * @desc    Get ML-based emission prediction for organization
 * @access  Private
 */
router.post('/prediction', auth, orgController.getOrganizationPrediction);

/**
 * @route   GET /api/org/benchmarks
 * @desc    Get sector benchmarks and industry standards
 * @access  Private
 */
router.get('/benchmarks', auth, orgController.getBenchmarks);

/**
 * @route   GET /api/org/peers
 * @desc    Get peer organization comparison
 * @access  Private
 */
router.get('/peers', auth, orgController.getPeers);

/**
 * @route   GET /api/org/missing-data
 * @desc    Check for missing emission data days
 * @access  Private
 */
router.get('/missing-data', auth, orgController.checkMissingData);

/**
 * @route   POST /api/org/fill-missing
 * @desc    Fill missing emission data with ML predictions
 * @access  Private
 */
router.post('/fill-missing', auth, orgController.fillMissingData);

module.exports = router;
