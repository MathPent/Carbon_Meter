const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Two-wheeler', 'Four-wheeler', 'Truck', 'Bus']
  },
  fuel: {
    type: String,
    required: true,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Petrol Hybrid']
  },
  engine: {
    type: String,
    required: true
  },
  mileage: {
    type: Number,
    required: true
  },
  mileage_unit: {
    type: String,
    required: true,
    enum: ['kmpl', 'km/kg', 'km/kWh']
  },
  co2_factor: {
    type: Number,
    required: true
  },
  co2_per_km: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster category queries
vehicleSchema.index({ category: 1 });
vehicleSchema.index({ fuel: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
