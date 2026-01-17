const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['Travel', 'Electricity', 'Food', 'Waste'],
    required: true,
  },
  description: {
    type: String,
  },
  carbonEmission: {
    type: Number, // in kg CO2
    required: true,
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

module.exports = mongoose.model('Activity', activitySchema);
