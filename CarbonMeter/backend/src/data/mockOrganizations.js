// Mock Organization Data for Industry Benchmarking
// India-focused companies across different sectors

const MOCK_ORGANIZATIONS = [
  // Manufacturing Sector
  {
    organizationName: 'Tata Steel Limited',
    sector: 'Manufacturing',
    industryType: 'Manufacturing',
    numberOfEmployees: 78000,
    totalEmissions: 312000, // tCO2e/year
    logo: '🏭',
    rank: 1,
    trend: 'up',
  },
  {
    organizationName: 'Mahindra & Mahindra',
    sector: 'Manufacturing',
    industryType: 'Manufacturing',
    numberOfEmployees: 65000,
    totalEmissions: 286000,
    logo: '🏭',
    rank: 2,
    trend: 'up',
  },
  {
    organizationName: 'Larsen & Toubro',
    sector: 'Manufacturing',
    industryType: 'Manufacturing',
    numberOfEmployees: 72000,
    totalEmissions: 388800,
    logo: '🏗️',
    rank: 3,
    trend: 'down',
  },
  {
    organizationName: 'Bharat Heavy Electricals',
    sector: 'Manufacturing',
    industryType: 'Manufacturing',
    numberOfEmployees: 45000,
    totalEmissions: 247500,
    logo: '⚡',
    rank: 4,
    trend: 'stable',
  },
  
  // IT Sector
  {
    organizationName: 'Tata Consultancy Services',
    sector: 'IT',
    industryType: 'IT',
    numberOfEmployees: 150000,
    totalEmissions: 225000, // tCO2e/year
    logo: '💻',
    rank: 1,
    trend: 'up',
  },
  {
    organizationName: 'Infosys Limited',
    sector: 'IT',
    industryType: 'IT',
    numberOfEmployees: 140000,
    totalEmissions: 238000,
    logo: '💻',
    rank: 2,
    trend: 'up',
  },
  {
    organizationName: 'Wipro Technologies',
    sector: 'IT',
    industryType: 'IT',
    numberOfEmployees: 135000,
    totalEmissions: 256500,
    logo: '💻',
    rank: 3,
    trend: 'stable',
  },
  {
    organizationName: 'HCL Technologies',
    sector: 'IT',
    industryType: 'IT',
    numberOfEmployees: 125000,
    totalEmissions: 275000,
    logo: '💻',
    rank: 4,
    trend: 'down',
  },
  {
    organizationName: 'Tech Mahindra',
    sector: 'IT',
    industryType: 'IT',
    numberOfEmployees: 85000,
    totalEmissions: 178500,
    logo: '💻',
    rank: 5,
    trend: 'up',
  },

  // Healthcare Sector
  {
    organizationName: 'Apollo Hospitals',
    sector: 'Healthcare',
    industryType: 'Healthcare',
    numberOfEmployees: 45000,
    totalEmissions: 121500,
    logo: '🏥',
    rank: 1,
    trend: 'up',
  },
  {
    organizationName: 'Fortis Healthcare',
    sector: 'Healthcare',
    industryType: 'Healthcare',
    numberOfEmployees: 38000,
    totalEmissions: 114000,
    logo: '🏥',
    rank: 2,
    trend: 'stable',
  },
  {
    organizationName: 'Max Healthcare',
    sector: 'Healthcare',
    industryType: 'Healthcare',
    numberOfEmployees: 32000,
    totalEmissions: 99200,
    logo: '🏥',
    rank: 3,
    trend: 'up',
  },

  // Education Sector
  {
    organizationName: 'IIT Delhi',
    sector: 'Education',
    industryType: 'Education',
    numberOfEmployees: 8500,
    totalEmissions: 17000,
    logo: '🎓',
    rank: 1,
    trend: 'up',
  },
  {
    organizationName: 'Amity University',
    sector: 'Education',
    industryType: 'Education',
    numberOfEmployees: 12000,
    totalEmissions: 28800,
    logo: '🎓',
    rank: 2,
    trend: 'stable',
  },
  {
    organizationName: 'Manipal Academy',
    sector: 'Education',
    industryType: 'Education',
    numberOfEmployees: 15000,
    totalEmissions: 36000,
    logo: '🎓',
    rank: 3,
    trend: 'down',
  },
];

// Benchmark Thresholds by Sector (tCO2e per employee per year)
const SECTOR_BENCHMARKS = {
  Manufacturing: {
    excellent: 3.5,
    average: 5.0,
    high: 7.0,
    industryAverage: 5.2,
    bestInClass: 2.8,
  },
  IT: {
    excellent: 1.5,
    average: 2.0,
    high: 3.0,
    industryAverage: 1.85,
    bestInClass: 1.2,
  },
  Healthcare: {
    excellent: 2.5,
    average: 3.0,
    high: 4.5,
    industryAverage: 3.1,
    bestInClass: 2.0,
  },
  Education: {
    excellent: 2.0,
    average: 2.5,
    high: 3.5,
    industryAverage: 2.4,
    bestInClass: 1.5,
  },
};

// Best Practices by Sector and Category
const BEST_PRACTICES_CATALOG = {
  Manufacturing: {
    'Electricity Consumption': [
      {
        title: 'Upgrade to IE3/IE4 Energy-Efficient Motors',
        description: 'Replace old motors with premium efficiency motors to cut energy use by 8-12%',
        potentialReduction: '8-12%',
        icon: '⚡',
        category: 'Energy',
      },
      {
        title: 'Install Variable Frequency Drives (VFDs)',
        description: 'Control motor speed dynamically to match actual load requirements',
        potentialReduction: '10-15%',
        icon: '⚙️',
        category: 'Energy',
      },
      {
        title: 'Optimize Compressed Air Systems',
        description: 'Fix leaks and reduce system pressure to minimize energy waste',
        potentialReduction: '5-8%',
        icon: '💨',
        category: 'Energy',
      },
    ],
    'Fuel Combustion': [
      {
        title: 'Waste Heat Recovery Systems',
        description: 'Capture and reuse heat from boilers and furnaces to reduce fuel consumption',
        potentialReduction: '12-18%',
        icon: '🔥',
        category: 'Process',
      },
      {
        title: 'Improve Furnace Insulation',
        description: 'Reduce thermal losses with high-performance insulation materials',
        potentialReduction: '6-10%',
        icon: '🧱',
        category: 'Process',
      },
    ],
  },
  IT: {
    'Electricity Consumption': [
      {
        title: 'Cloud Infrastructure Optimization',
        description: 'Rightsize instances and enable auto-scaling to reduce idle compute capacity',
        potentialReduction: '12-20%',
        icon: '☁️',
        category: 'Infrastructure',
      },
      {
        title: 'Server Consolidation & Virtualization',
        description: 'Consolidate workloads to reduce physical server count and cooling needs',
        potentialReduction: '15-25%',
        icon: '💻',
        category: 'Infrastructure',
      },
      {
        title: 'Implement Smart Cooling Systems',
        description: 'Use AI-driven HVAC controls for data centers to optimize temperature zones',
        potentialReduction: '10-15%',
        icon: '❄️',
        category: 'Infrastructure',
      },
    ],
    'Business Travel': [
      {
        title: 'Virtual-First Meeting Policy',
        description: 'Replace short-haul travel with video conferencing for routine meetings',
        potentialReduction: '20-30%',
        icon: '📹',
        category: 'Travel',
      },
    ],
  },
  Healthcare: {
    'Electricity Consumption': [
      {
        title: 'HVAC Scheduling & Setpoint Optimization',
        description: 'Program HVAC systems to reduce energy during off-peak hours',
        potentialReduction: '8-12%',
        icon: '🌡️',
        category: 'Energy',
      },
      {
        title: 'LED Lighting Retrofit',
        description: 'Replace fluorescent lights with LED fixtures across facilities',
        potentialReduction: '6-9%',
        icon: '💡',
        category: 'Energy',
      },
    ],
  },
  Education: {
    'Electricity Consumption': [
      {
        title: 'Occupancy Sensors for Classrooms',
        description: 'Automatically control lighting and HVAC based on room occupancy',
        potentialReduction: '7-10%',
        icon: '👥',
        category: 'Energy',
      },
      {
        title: 'Solar Panel Installation',
        description: 'Install rooftop solar to offset grid electricity consumption',
        potentialReduction: '15-25%',
        icon: '☀️',
        category: 'Renewable',
      },
    ],
  },
};

module.exports = {
  MOCK_ORGANIZATIONS,
  SECTOR_BENCHMARKS,
  BEST_PRACTICES_CATALOG,
};
