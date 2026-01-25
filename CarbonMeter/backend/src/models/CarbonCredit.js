const mongoose = require('mongoose');

/**
 * Carbon Credit Model
 * Manages carbon credits earned and used by organizations
 * 1 credit = 1 tCO2e offset
 */
const carbonCreditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  organizationName: String,
  
  // Transaction Type
  transactionType: {
    type: String,
    enum: ['earned', 'purchased', 'used', 'transferred', 'expired'],
    required: true,
  },
  
  // Credit Details
  credits: {
    type: Number,
    required: true,
  },
  creditType: {
    type: String,
    enum: ['Renewable Energy', 'Energy Efficiency', 'Reforestation', 'Carbon Capture', 'Purchased', 'Other'],
  },
  
  // Source/Reason
  source: {
    type: String,
    enum: ['Solar Power', 'Wind Power', 'Energy Efficiency Project', 'Tree Plantation', 'Carbon Market', 'Offset Purchase', 'Voluntary Reduction'],
  },
  description: String,
  
  // Financial Data
  pricePerCredit: Number, // in INR
  totalCost: Number, // in INR
  currency: {
    type: String,
    default: 'INR',
  },
  
  // Certification
  certificateNumber: String,
  certificateIssuer: String,
  certificateDate: Date,
  certificateUrl: String,
  
  // Validity
  validFrom: Date,
  validUntil: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Verification
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: String,
  verifiedAt: Date,
  
  // Related Activity (if generated from reduction project)
  relatedActivity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrgActivity',
  },
  
  // Transaction Date
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  
  // Metadata
  notes: String,
  attachments: [String],
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
carbonCreditSchema.index({ userId: 1, transactionDate: -1 });
carbonCreditSchema.index({ userId: 1, transactionType: 1 });
carbonCreditSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('CarbonCredit', carbonCreditSchema);
