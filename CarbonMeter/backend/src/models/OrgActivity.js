const mongoose = require('mongoose');

/**
 * Organization Activity Model
 * Stores emission activities logged by organizations
 * Supports Scope 1, 2, and 3 emissions with detailed breakdowns
 */
const orgActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  organizationName: {
    type: String,
  },
  
  // Activity Period
  activityDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  reportingPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly',
  },
  startDate: Date,
  endDate: Date,
  
  // Emission Scope
  scope: {
    type: String,
    enum: ['Scope 1', 'Scope 2', 'Scope 3'],
    required: true,
  },
  
  // Activity Category
  category: {
    type: String,
    required: true,
    enum: [
      // Scope 1
      'Fuel Combustion',
      'Company Vehicles',
      'Machinery & Equipment',
      'Process Emissions',
      'Refrigerants',
      'Fugitive Emissions',
      
      // Scope 2
      'Electricity Consumption',
      'Purchased Steam',
      'Purchased Heating',
      'Purchased Cooling',
      
      // Scope 3
      'Business Travel',
      'Employee Commuting',
      'Freight & Logistics',
      'Waste Generated',
      'Purchased Goods',
      'Raw Materials',
      'Capital Goods',
      'Upstream Transport',
      'Downstream Transport',
    ],
  },
  
  // Activity Data (flexible structure for different activity types)
  activityData: {
    // Fuel data
    fuelType: String, // Petrol, Diesel, CNG, Natural Gas, LPG, Coal, Furnace Oil
    quantity: Number,
    unit: String, // litres, kg, tonnes, cubic meters, kWh
    
    // Transport data
    distance: Number,
    distanceUnit: String, // km, miles
    mode: String, // Car, Truck, Rail, Ship, Air
    weight: Number, // for freight
    
    // Electricity data
    consumption: Number,
    source: String, // Grid, Captive, Renewable
    
    // Process data
    processType: String, // Cement clinker, Steel blast furnace, etc.
    productionVolume: Number,
    
    // Additional fields
    description: String,
    rawData: mongoose.Schema.Types.Mixed, // Store original calculation data
  },
  
  // Calculated Emissions
  emissionValue: {
    type: Number,
    required: true,
    default: 0,
  },
  emissionUnit: {
    type: String,
    default: 'tCO2e',
  },
  
  // Emission Factor Used
  emissionFactor: {
    value: Number,
    unit: String,
    source: String, // IPCC, India CPCB, Custom
  },
  
  // GHG Breakdown (for detailed reporting)
  ghgBreakdown: {
    co2: Number,
    ch4: Number,
    n2o: Number,
    hfcs: Number,
    pfcs: Number,
    sf6: Number,
    nf3: Number,
  },
  
  // Production Metrics (for intensity calculations)
  productionData: {
    productionVolume: Number,
    productionUnit: String,
    numberOfEmployees: Number,
    revenue: Number,
  },
  
  // Verification & Audit
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: String,
  verifiedAt: Date,
  
  // Metadata
  calculationMethod: String,
  dataSource: String,
  notes: String,
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
orgActivitySchema.index({ userId: 1, activityDate: -1 });
orgActivitySchema.index({ userId: 1, scope: 1 });
orgActivitySchema.index({ userId: 1, category: 1 });
orgActivitySchema.index({ createdAt: -1 });

// Virtual for emission intensity
orgActivitySchema.virtual('emissionIntensity').get(function() {
  if (this.productionData && this.productionData.productionVolume) {
    return this.emissionValue / this.productionData.productionVolume;
  }
  return 0;
});

module.exports = mongoose.model('OrgActivity', orgActivitySchema);
