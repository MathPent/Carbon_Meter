const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['Transport', 'Electricity', 'Food', 'Waste'],
    required: true,
  },
  logType: {
    type: String,
    enum: ['manual', 'quick', 'automatic'],
    default: 'manual',
  },
  description: {
    type: String,
  },
  carbonEmission: {
    type: Number, // in kg CO2e
    required: true,
  },
  // Transport specific data
  transportData: {
    mode: { type: String, enum: ['road', 'air', 'rail', 'Automatic'] },
    vehicleType: String,
    fuelType: String,
    distance: Number,
    mileage: Number,
    fuelConsumed: Number,
    // Automatic transport fields
    vehicleId: mongoose.Schema.Types.ObjectId,
    vehicleModel: String,
    vehicleFuel: String,
    startLocation: {
      lat: Number,
      lng: Number
    },
    endLocation: {
      lat: Number,
      lng: Number
    }
  },
  // Electricity specific data
  electricityData: {
    source: { type: String, enum: ['grid', 'dg', 'renewable'] },
    consumption: Number, // kWh
  },
  // Food specific data
  foodData: {
    type: { type: String, enum: ['animal', 'plant'] },
    items: [{
      name: String,
      quantity: Number,
      emissionFactor: Number,
      emission: Number,
    }],
  },
  // Waste specific data
  wasteData: {
    foodWaste: Number,
    solidWaste: Number,
    liquidWaste: Number,
  },
  formula: {
    type: String, // Store the formula used for calculation
  },
  source: {
    type: String, // Government source reference
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast queries
activitySchema.index({ userId: 1, date: -1 });
activitySchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Activity', activitySchema);
