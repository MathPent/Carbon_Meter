/**
 * Government Emission Factors and Calculations
 * Based on Indian Government Standards (CPCB / NITI Aayog)
 */

// Emission factors in kg CO2e per unit
export const GOV_EMISSION_FACTORS = {
  // Transport (kg CO2e per km)
  transport: {
    petrol: 2.31,  // per liter
    diesel: 2.68,  // per liter
    cng: 1.85,     // per kg
    electric: 0.82, // per kWh (considering grid mix)
    
    // Average factors per km for different vehicle types
    sedanPetrol: 0.171,
    sedanDiesel: 0.168,
    suvPetrol: 0.257,
    suvDiesel: 0.209,
    bus: 0.089,
    ambulance: 0.185,
    truck: 0.628,
    scooter: 0.067,
  },
  
  // Electricity (kg CO2e per kWh)
  electricity: {
    grid: 0.82,        // Indian grid average
    dgSet: 2.68,       // Diesel generator
    solar: 0.048,      // Solar PV
    wind: 0.011,       // Wind power
    renewable: 0.03,   // Average renewable
  },
  
  // Waste (kg CO2e per kg)
  waste: {
    municipal: 0.05,
    biomedical: 0.95,
    hazardous: 1.15,
    plastic: 6.0,
    ewaste: 3.2,
  },
  
  // Water treatment (kg CO2e per m³)
  water: {
    treatment: 0.344,
    distribution: 0.195,
  },
  
  // Fuel for DG Sets and Industrial use
  fuel: {
    dieselPerLiter: 2.68,
    petrolPerLiter: 2.31,
    cngPerKg: 1.85,
    lpgPerKg: 2.98,
    coalPerKg: 2.42,
  },
};

// Organization types and their typical activities
export const GOV_ORGANIZATION_TYPES = {
  'Government Transport': {
    label: 'Government Transport (Road, Rail, Aviation)',
    modules: ['vehicle', 'fuel', 'distance'],
    icon: '🚗',
  },
  'Buildings & Offices': {
    label: 'Buildings & Government Offices',
    modules: ['electricity', 'dgSets', 'hvac'],
    icon: '🏢',
  },
  'Health Infrastructure': {
    label: 'Hospitals & Health Centers',
    modules: ['electricity', 'ambulance', 'waste'],
    icon: '🏥',
  },
  'Municipal Services': {
    label: 'Municipal & Urban Services',
    modules: ['waste', 'water', 'vehicles', 'streetLighting'],
    icon: '🏛️',
  },
  'Education Institutions': {
    label: 'Schools, Colleges & Universities',
    modules: ['electricity', 'hostel', 'transport'],
    icon: '🎓',
  },
  'Industries & PSUs': {
    label: 'Public Sector Industries',
    modules: ['fuel', 'production', 'electricity'],
    icon: '🏭',
  },
};

// Calculate emission based on activity type
export const calculateGovEmission = (activityType, data) => {
  let emission = 0;
  
  switch (activityType) {
    case 'vehicle':
      if (data.fuelType && data.fuelConsumed) {
        const fuelKey = data.fuelType.toLowerCase() + 'PerLiter';
        emission = (GOV_EMISSION_FACTORS.fuel[fuelKey] || 0) * data.fuelConsumed;
      } else if (data.vehicleType && data.distance) {
        const vehicleKey = data.vehicleType.toLowerCase().replace(/\s/g, '');
        emission = (GOV_EMISSION_FACTORS.transport[vehicleKey] || 0.2) * data.distance;
      }
      break;
      
    case 'electricity':
      const source = data.source || 'grid';
      emission = GOV_EMISSION_FACTORS.electricity[source] * data.consumption;
      break;
      
    case 'dgSet':
      emission = GOV_EMISSION_FACTORS.fuel.dieselPerLiter * data.fuelConsumed;
      break;
      
    case 'waste':
      const wasteType = data.wasteType || 'municipal';
      emission = GOV_EMISSION_FACTORS.waste[wasteType] * data.quantity;
      break;
      
    case 'water':
      emission = GOV_EMISSION_FACTORS.water.treatment * data.volume;
      break;
      
    case 'fuel':
      const fuelType = data.fuelType.toLowerCase() + 'Per' + (data.unit === 'kg' ? 'Kg' : 'Liter');
      emission = (GOV_EMISSION_FACTORS.fuel[fuelType] || 0) * data.quantity;
      break;
      
    default:
      emission = 0;
  }
  
  return Number(emission.toFixed(3));
};

// Get formula for display
export const getEmissionFormula = (activityType, data) => {
  switch (activityType) {
    case 'vehicle':
      if (data.fuelConsumed) {
        return `${data.fuelConsumed} L × Emission Factor = ${calculateGovEmission(activityType, data)} kg CO2e`;
      }
      return `${data.distance} km × ${data.vehicleType} Factor = ${calculateGovEmission(activityType, data)} kg CO2e`;
      
    case 'electricity':
      return `${data.consumption} kWh × ${data.source || 'grid'} Factor (${GOV_EMISSION_FACTORS.electricity[data.source || 'grid']}) = ${calculateGovEmission(activityType, data)} kg CO2e`;
      
    case 'waste':
      return `${data.quantity} kg × ${data.wasteType} Factor = ${calculateGovEmission(activityType, data)} kg CO2e`;
      
    default:
      return `Emission: ${calculateGovEmission(activityType, data)} kg CO2e`;
  }
};

// Get category from activity type
export const getCategoryFromActivityType = (activityType) => {
  const categoryMap = {
    vehicle: 'Transport',
    fuel: 'Transport',
    distance: 'Transport',
    electricity: 'Electricity',
    dgSet: 'Electricity',
    hvac: 'Electricity',
    waste: 'Waste',
    water: 'Waste',
    production: 'Industrial',
  };
  
  return categoryMap[activityType] || 'Other';
};
