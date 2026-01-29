const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const auth = require('../middleware/auth');

// Alias routes to satisfy requested API contract:
// /api/organization/...

router.get('/leaderboard', auth, orgController.getOrgLeaderboard);
router.get('/compare/peers', auth, orgController.getPeerComparison);
router.get('/benchmarks', auth, orgController.getSectorBenchmarks);
router.get('/compare/percentile', auth, orgController.getSectorPercentile);
router.get('/best-practices', auth, orgController.getBestPractices);

module.exports = router;
