const mongoose = require('mongoose');

const userTipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tips: [{
    category: {
      type: String,
      enum: ['Transport', 'Electricity', 'Food', 'Waste', 'General'],
      required: true
    },
    tip: {
      type: String,
      required: true
    },
    impact: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    }
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  },
  basedOn: {
    type: String,
    default: 'last_day'
  },
  emissionSummary: {
    totalEmissions: Number,
    categoryBreakdown: {
      Transport: Number,
      Electricity: Number,
      Food: Number,
      Waste: Number
    },
    highestCategory: String,
    highestPercentage: Number
  }
}, {
  timestamps: true
});

// Index for faster queries
userTipSchema.index({ userId: 1, generatedAt: -1 });

// Auto-delete tips older than 24 hours (optional)
userTipSchema.index({ generatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('UserTip', userTipSchema);
