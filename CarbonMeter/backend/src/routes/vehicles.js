const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// GET all vehicles (with optional category filter)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = {};
    if (category) {
      query.category = category;
    }

    const vehicles = await Vehicle.find(query).sort({ model: 1 });
    
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles',
      error: error.message
    });
  }
});

// GET vehicle categories
router.get('/categories', async (req, res) => {
  try {
    console.log('[Vehicles] Fetching categories...');
    const categories = await Vehicle.distinct('category');
    console.log('[Vehicles] Found categories:', categories);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('[Vehicles] Error fetching categories:', error);
    // Return empty array on error instead of failing
    res.json({
      success: true,
      data: ['Car', 'Bike', 'Public Transport'], // Fallback categories
      message: 'Using default categories due to database error'
    });
  }
});

// GET single vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle',
      error: error.message
    });
  }
});

module.exports = router;
