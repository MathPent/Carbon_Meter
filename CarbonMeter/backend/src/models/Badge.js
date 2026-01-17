const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  badgeName: {
    type: String,
    enum: ['Eco Hero', 'Green Warrior', 'Carbon Saver', 'Certified Activist'],
    required: true,
  },
  description: {
    type: String,
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Badge', badgeSchema);
