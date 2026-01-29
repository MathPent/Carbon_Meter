const mongoose = require('mongoose');

/**
 * Schema for storing organization-level ML predictions
 * Tracks predicted emissions, trends, and confidence scores
 */
const OrganizationPredictionSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  period: {
    type: String,  // Format: "YYYY-MM"
    required: true,
    index: true
  },
  
  predictedEmission: {
    type: Number,
    required: true
  },
  // Backward compatibility
  predicted_emission: {
    type: Number,
    default: null
  },

  predictedFor: {
    type: String
  },

  industry: {
    type: String,
    default: 'Manufacturing'
  },
  
  trend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable'],
    default: 'stable'
  },
  
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.75
  },

  isFallback: {
    type: Boolean,
    default: false
  },
  
  benchmark_percentile: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },

  breakdown: {
    scope1_percentage: Number,
    scope2_percentage: Number,
    scope1_emission: Number,
    scope2_emission: Number
  },

  recommendations: [{
    type: String
  }],

  industryInsights: {
    main_source: String,
    percentage: String,
    reduction_potential: String,
    benchmark: String
  },

  inputFeatures: {
    electricity_kwh: [Number],
    diesel_liters: [Number],
    natural_gas_m3: [Number],
    production_units: [Number]
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },

  source: {
    type: String,
    enum: ['XGBoost ML Model', 'Fallback Estimation', 'Error Fallback'],
    default: 'XGBoost ML Model'
  },
  
  demo: {
    type: Boolean,
    default: false
  },
  
  historical_days: {
    type: Number,
    default: 0
  },
  
  metadata: {
    sector: String,
    employee_count: Number,
    message: String
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
OrganizationPredictionSchema.index({ organizationId: 1, period: 1 });
OrganizationPredictionSchema.index({ createdAt: -1 });
OrganizationPredictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

OrganizationPredictionSchema.pre('save', function(next) {
  if (!this.predictedEmission && this.predicted_emission) {
    this.predictedEmission = this.predicted_emission;
  }
  if (!this.predicted_emission && this.predictedEmission) {
    this.predicted_emission = this.predictedEmission;
  }
  next();
});

OrganizationPredictionSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

OrganizationPredictionSchema.statics.getLatestPrediction = function(organizationId) {
  return this.findOne({ organizationId })
    .sort({ createdAt: -1 })
    .exec();
};

OrganizationPredictionSchema.statics.getPredictionHistory = function(organizationId, limit = 10) {
  return this.find({ organizationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

module.exports = mongoose.model('OrganizationPrediction', OrganizationPredictionSchema);
