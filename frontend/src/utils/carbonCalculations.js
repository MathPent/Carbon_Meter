/**
 * Carbon Emission Calculation Utilities
 * Pre-Login Carbon Calculator
 * 
 * All emission factors are based on verified standards
 * and match the main app's calculation logic
 */

// ==========================================
// EMISSION FACTOR CONSTANTS
// ==========================================

// Electricity emission factor (kg CO₂ per kWh)
export const ELECTRICITY_EMISSION_FACTOR = 0.82;

// Fuel emission factors (kg CO₂ per unit)
export const FUEL_EMISSION_FACTORS = {
  petrol: 2.31,  // per liter
  diesel: 2.68,  // per liter
  cng: 2.75,     // per kg
  electric: 0.82 // per kWh
};

// Air travel emission factor (kg CO₂ per km)
export const AIR_TRAVEL_EMISSION_FACTOR = 0.15;

// Food waste emission factor (kg CO₂ per kg waste)
export const FOOD_WASTE_EMISSION_FACTOR = 2.5;

// Diet emission factors (kg CO₂ per day)
export const DIET_EMISSION_FACTORS = {
  vegan: 2.5,
  vegetarian: 3.8,
  mixed: 5.6,
  meatHeavy: 7.2
};

// Food locality multipliers
export const FOOD_LOCALITY_MULTIPLIERS = {
  none: 1.3,
  some: 1.15,
  most: 0.95,
  all: 0.8
};

// Housing type base emissions (kg CO₂ per month)
export const HOUSING_BASE_EMISSIONS = {
  independentHouse: 150,
  apartment: 100,
  sharedHousing: 60
};

// Energy efficiency multipliers
export const ENERGY_EFFICIENCY_MULTIPLIERS = {
  low: 1.4,
  medium: 1.0,
  high: 0.7
};

// Waste emission factors (kg CO₂ per month)
export const WASTE_EMISSIONS = {
  low: 20,
  average: 50,
  high: 100
};

// Public transport emission factor (kg CO₂ per km)
export const PUBLIC_TRANSPORT_EMISSION_FACTOR = 0.05;

// ==========================================
// CALCULATION FUNCTIONS
// ==========================================

/**
 * Calculate electricity emissions
 * @param {number} kWh - Monthly electricity usage in kWh
 * @returns {number} CO₂ emissions in kg
 */
export const calculateElectricityEmissions = (kWh) => {
  return kWh * ELECTRICITY_EMISSION_FACTOR;
};

/**
 * Calculate housing emissions
 * @param {string} housingType - Type of housing
 * @param {number} householdSize - Number of people
 * @param {string} efficiency - Energy efficiency level
 * @returns {number} CO₂ emissions in kg per month
 */
export const calculateHousingEmissions = (housingType, householdSize, efficiency) => {
  const baseEmission = HOUSING_BASE_EMISSIONS[housingType] || 100;
  const efficiencyMultiplier = ENERGY_EFFICIENCY_MULTIPLIERS[efficiency] || 1.0;
  
  // Divide by household size for per-person estimate
  return (baseEmission * efficiencyMultiplier) / (householdSize || 1);
};

/**
 * Calculate food emissions
 * @param {string} diet - Diet type
 * @param {string} locality - Food locality level
 * @returns {number} CO₂ emissions in kg per month
 */
export const calculateFoodEmissions = (diet, locality) => {
  const dailyEmission = DIET_EMISSION_FACTORS[diet] || 5.6;
  const localityMultiplier = FOOD_LOCALITY_MULTIPLIERS[locality] || 1.0;
  
  // Monthly emissions (30 days)
  return dailyEmission * 30 * localityMultiplier;
};

/**
 * Calculate waste emissions
 * @param {string} wasteLevel - Waste generation level
 * @returns {number} CO₂ emissions in kg per month
 */
export const calculateWasteEmissions = (wasteLevel) => {
  return WASTE_EMISSIONS[wasteLevel] || 50;
};

/**
 * Calculate personal transport emissions
 * @param {number} weeklyDistance - Weekly distance in km
 * @param {string} fuelType - Type of fuel
 * @param {boolean} isShared - Whether travel is shared
 * @returns {number} CO₂ emissions in kg per month
 */
export const calculatePersonalTransportEmissions = (weeklyDistance, fuelType, isShared) => {
  // Estimate fuel consumption based on vehicle type
  // Average fuel consumption: 
  // Petrol: 12 km/L, Diesel: 15 km/L, CNG: 20 km/kg, Electric: 6 km/kWh
  
  let emissionPerKm = 0;
  
  switch(fuelType) {
    case 'petrol':
      emissionPerKm = FUEL_EMISSION_FACTORS.petrol / 12; // kg CO₂ per km
      break;
    case 'diesel':
      emissionPerKm = FUEL_EMISSION_FACTORS.diesel / 15;
      break;
    case 'cng':
      emissionPerKm = FUEL_EMISSION_FACTORS.cng / 20;
      break;
    case 'electric':
      emissionPerKm = FUEL_EMISSION_FACTORS.electric / 6;
      break;
    default:
      emissionPerKm = 0.2; // Default estimate
  }
  
  const monthlyDistance = weeklyDistance * 4.33; // Average weeks per month
  const totalEmission = monthlyDistance * emissionPerKm;
  
  // If shared, divide by 2 (approximate)
  return isShared ? totalEmission / 2 : totalEmission;
};

/**
 * Calculate public transport emissions
 * @param {number} weeklyDistance - Weekly distance in km
 * @returns {number} CO₂ emissions in kg per month
 */
export const calculatePublicTransportEmissions = (weeklyDistance) => {
  const monthlyDistance = weeklyDistance * 4.33;
  return monthlyDistance * PUBLIC_TRANSPORT_EMISSION_FACTOR;
};

/**
 * Calculate air travel emissions
 * @param {string} flightFrequency - Frequency of flights per year
 * @returns {number} CO₂ emissions in kg per month
 */
export const calculateAirTravelEmissions = (flightFrequency) => {
  // Estimate average flight distance based on frequency
  let yearlyDistance = 0;
  
  switch(flightFrequency) {
    case 'none':
      yearlyDistance = 0;
      break;
    case '1-2':
      yearlyDistance = 2000; // Short haul flights
      break;
    case '3-5':
      yearlyDistance = 6000; // Mix of short and medium haul
      break;
    case '5+':
      yearlyDistance = 12000; // Frequent flyer
      break;
    default:
      yearlyDistance = 0;
  }
  
  const yearlyEmission = yearlyDistance * AIR_TRAVEL_EMISSION_FACTOR;
  return yearlyEmission / 12; // Monthly average
};

/**
 * Calculate government facility emissions (limited estimate)
 * @param {number} facilityElectricity - Monthly electricity usage of facility in kWh
 * @param {number} usageFrequency - How often user uses facility (0-1 scale)
 * @returns {number} CO₂ emissions in kg per month
 */
export const calculateGovernmentEmissions = (facilityElectricity, usageFrequency = 0.1) => {
  // User only accounts for their proportional usage
  const totalFacilityEmission = facilityElectricity * ELECTRICITY_EMISSION_FACTOR;
  return totalFacilityEmission * usageFrequency;
};

/**
 * Calculate total carbon footprint
 * @param {Object} data - All user input data
 * @returns {Object} Breakdown of emissions by category
 */
export const calculateTotalFootprint = (data) => {
  const breakdown = {
    electricity: calculateElectricityEmissions(data.electricityUsage || 0),
    housing: calculateHousingEmissions(
      data.housingType || 'apartment',
      data.householdSize || 1,
      data.energyEfficiency || 'medium'
    ),
    food: calculateFoodEmissions(
      data.diet || 'mixed',
      data.foodLocality || 'some'
    ),
    waste: calculateWasteEmissions(data.wasteLevel || 'average'),
    personalTransport: calculatePersonalTransportEmissions(
      data.personalTransportDistance || 0,
      data.fuelType || 'petrol',
      data.isSharedTransport || false
    ),
    publicTransport: calculatePublicTransportEmissions(data.publicTransportDistance || 0),
    airTravel: calculateAirTravelEmissions(data.flightFrequency || 'none'),
    government: calculateGovernmentEmissions(
      data.govFacilityElectricity || 0,
      data.govUsageFrequency || 0.05
    )
  };
  
  // Calculate total
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  
  return {
    total: Math.round(total * 10) / 10, // Round to 1 decimal place
    breakdown: {
      electricity: Math.round(breakdown.electricity * 10) / 10,
      housing: Math.round(breakdown.housing * 10) / 10,
      food: Math.round(breakdown.food * 10) / 10,
      waste: Math.round(breakdown.waste * 10) / 10,
      personalTransport: Math.round(breakdown.personalTransport * 10) / 10,
      publicTransport: Math.round(breakdown.publicTransport * 10) / 10,
      airTravel: Math.round(breakdown.airTravel * 10) / 10,
      government: Math.round(breakdown.government * 10) / 10
    }
  };
};

/**
 * Get comparison message based on footprint
 * @param {number} totalEmissions - Total monthly emissions in kg
 * @returns {string} Comparison message
 */
export const getComparisonMessage = (totalEmissions) => {
  const yearlyEmissions = totalEmissions * 12;
  const tonnesPerYear = yearlyEmissions / 1000;
  
  if (tonnesPerYear < 4) {
    return 'Excellent! Your carbon footprint is below the global average.';
  } else if (tonnesPerYear < 7) {
    return 'Your footprint is near the global average. There\'s room for improvement!';
  } else if (tonnesPerYear < 10) {
    return 'Your footprint is above average. Consider sustainable alternatives.';
  } else {
    return 'Your footprint is significantly above average. Let\'s work together to reduce it!';
  }
};
