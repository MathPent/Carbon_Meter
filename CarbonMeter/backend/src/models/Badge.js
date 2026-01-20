const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
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

// Compound index to prevent duplicate badges for same user
badgeSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Badge', badgeSchema);
