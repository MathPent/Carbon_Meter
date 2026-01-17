const mongoose = require('mongoose');

const carbonSavingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  carbonSaved: {
    type: Number, // in kg CO2
    required: true,
  },
  category: {
    type: String,
    enum: ['Travel', 'Electricity', 'Food', 'Waste'],
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

module.exports = mongoose.model('CarbonSaving', carbonSavingSchema);
