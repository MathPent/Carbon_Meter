/**
 * Industry Demo Data for Benchmarking Feature
 * Used when organization data is incomplete or missing
 * All companies are Indian, emission values are realistic estimates
 */

const INDUSTRY_DEMO_DATA = {
  IT: [
    { 
      name: "Infosys", 
      logo: null, // Logo removed to prevent console errors
      emissionPerEmployee: 2.1,
      totalEmissions: 168000,
      numberOfEmployees: 80000,
      sector: "IT"
    },
    { 
      name: "TCS", 
      logo: null, 
      emissionPerEmployee: 2.4,
      totalEmissions: 240000,
      numberOfEmployees: 100000,
      sector: "IT"
    },
    { 
      name: "Wipro", 
      logo: null, 
      emissionPerEmployee: 2.6,
      totalEmissions: 182000,
      numberOfEmployees: 70000,
      sector: "IT"
    },
    { 
      name: "HCL Technologies", 
      logo: null, 
      emissionPerEmployee: 2.3,
      totalEmissions: 138000,
      numberOfEmployees: 60000,
      sector: "IT"
    },
    { 
      name: "Tech Mahindra", 
      logo: null, 
      emissionPerEmployee: 2.5,
      totalEmissions: 125000,
      numberOfEmployees: 50000,
      sector: "IT"
    }
  ],
  
  Manufacturing: [
    { 
      name: "Tata Steel", 
      logo: null, 
      emissionPerEmployee: 5.9,
      totalEmissions: 472000,
      numberOfEmployees: 80000,
      sector: "Manufacturing"
    },
    { 
      name: "JSW Steel", 
      logo: null, 
      emissionPerEmployee: 6.4,
      totalEmissions: 384000,
      numberOfEmployees: 60000,
      sector: "Manufacturing"
    },
    { 
      name: "Mahindra & Mahindra", 
      logo: null, 
      emissionPerEmployee: 5.2,
      totalEmissions: 312000,
      numberOfEmployees: 60000,
      sector: "Manufacturing"
    },
    { 
      name: "Larsen & Toubro", 
      logo: null, 
      emissionPerEmployee: 4.8,
      totalEmissions: 336000,
      numberOfEmployees: 70000,
      sector: "Manufacturing"
    },
    { 
      name: "Bharat Heavy Electricals", 
      logo: null, 
      emissionPerEmployee: 5.5,
      totalEmissions: 275000,
      numberOfEmployees: 50000,
      sector: "Manufacturing"
    }
  ],
  
  Energy: [
    { 
      name: "Adani Green Energy", 
      logo: null, 
      emissionPerEmployee: 3.2,
      totalEmissions: 96000,
      numberOfEmployees: 30000,
      sector: "Energy"
    },
    { 
      name: "NTPC", 
      logo: null, 
      emissionPerEmployee: 4.1,
      totalEmissions: 164000,
      numberOfEmployees: 40000,
      sector: "Energy"
    },
    { 
      name: "Power Grid Corporation", 
      logo: null, 
      emissionPerEmployee: 3.8,
      totalEmissions: 114000,
      numberOfEmployees: 30000,
      sector: "Energy"
    },
    { 
      name: "Tata Power", 
      logo: null, 
      emissionPerEmployee: 3.6,
      totalEmissions: 108000,
      numberOfEmployees: 30000,
      sector: "Energy"
    },
    { 
      name: "ReNew Power", 
      logo: null, 
      emissionPerEmployee: 2.9,
      totalEmissions: 72500,
      numberOfEmployees: 25000,
      sector: "Energy"
    }
  ],
  
  Healthcare: [
    { 
      name: "Apollo Hospitals", 
      logo: null, 
      emissionPerEmployee: 3.4,
      totalEmissions: 204000,
      numberOfEmployees: 60000,
      sector: "Healthcare"
    },
    { 
      name: "Fortis Healthcare", 
      logo: null, 
      emissionPerEmployee: 3.6,
      totalEmissions: 144000,
      numberOfEmployees: 40000,
      sector: "Healthcare"
    },
    { 
      name: "Max Healthcare", 
      logo: null, 
      emissionPerEmployee: 3.5,
      totalEmissions: 105000,
      numberOfEmployees: 30000,
      sector: "Healthcare"
    },
    { 
      name: "Dr. Reddy's Laboratories", 
      logo: null, 
      emissionPerEmployee: 3.8,
      totalEmissions: 95000,
      numberOfEmployees: 25000,
      sector: "Healthcare"
    },
    { 
      name: "Cipla", 
      logo: null, 
      emissionPerEmployee: 3.3,
      totalEmissions: 82500,
      numberOfEmployees: 25000,
      sector: "Healthcare"
    }
  ],
  
  Education: [
    { 
      name: "BYJU's", 
      logo: null, 
      emissionPerEmployee: 1.8,
      totalEmissions: 36000,
      numberOfEmployees: 20000,
      sector: "Education"
    },
    { 
      name: "Unacademy", 
      logo: null, 
      emissionPerEmployee: 1.6,
      totalEmissions: 24000,
      numberOfEmployees: 15000,
      sector: "Education"
    },
    { 
      name: "upGrad", 
      logo: null, 
      emissionPerEmployee: 1.7,
      totalEmissions: 17000,
      numberOfEmployees: 10000,
      sector: "Education"
    },
    { 
      name: "Vedantu", 
      logo: null, 
      emissionPerEmployee: 1.5,
      totalEmissions: 12000,
      numberOfEmployees: 8000,
      sector: "Education"
    },
    { 
      name: "PhysicsWallah", 
      logo: null, 
      emissionPerEmployee: 1.4,
      totalEmissions: 8400,
      numberOfEmployees: 6000,
      sector: "Education"
    }
  ]
};

// Sector-specific benchmarks (kg CO2e per employee per year)
const SECTOR_BENCHMARKS = {
  IT: {
    excellent: 2.0,
    good: 2.5,
    average: 3.0,
    needsImprovement: 3.5
  },
  Manufacturing: {
    excellent: 4.5,
    good: 5.5,
    average: 6.5,
    needsImprovement: 7.5
  },
  Energy: {
    excellent: 3.0,
    good: 3.5,
    average: 4.0,
    needsImprovement: 4.5
  },
  Healthcare: {
    excellent: 3.0,
    good: 3.5,
    average: 4.0,
    needsImprovement: 4.5
  },
  Education: {
    excellent: 1.5,
    good: 2.0,
    average: 2.5,
    needsImprovement: 3.0
  }
};

// Best practices by sector and emission category
const BEST_PRACTICES_BY_SECTOR = {
  IT: {
    high: [
      "Migrate to energy-efficient cloud infrastructure",
      "Implement server virtualization to reduce hardware",
      "Switch to renewable energy for data centers",
      "Optimize cooling systems with AI-based controls",
      "Adopt remote work policies to reduce commute emissions"
    ],
    medium: [
      "Install smart building management systems",
      "Use LED lighting with motion sensors",
      "Encourage public transport usage",
      "Implement digital-first policies to reduce paper",
      "Optimize HVAC systems for energy efficiency"
    ],
    low: [
      "Continue monitoring emission trends",
      "Share best practices with industry peers",
      "Set more ambitious reduction targets",
      "Invest in carbon offset programs",
      "Regular energy audits every quarter"
    ]
  },
  Manufacturing: {
    high: [
      "Upgrade to energy-efficient machinery",
      "Install solar panels on factory roofs",
      "Implement waste heat recovery systems",
      "Switch to electric forklifts and vehicles",
      "Optimize production schedules to reduce energy peaks"
    ],
    medium: [
      "Regular maintenance to prevent energy waste",
      "Install variable frequency drives on motors",
      "Improve insulation in buildings",
      "Use natural lighting where possible",
      "Implement lean manufacturing principles"
    ],
    low: [
      "Continue current sustainability practices",
      "Monitor supply chain emissions",
      "Set science-based targets",
      "Invest in R&D for cleaner processes",
      "Regular benchmarking against industry leaders"
    ]
  },
  Energy: {
    high: [
      "Accelerate renewable energy adoption",
      "Retire oldest coal-based facilities",
      "Invest in battery storage solutions",
      "Implement smart grid technologies",
      "Carbon capture and storage pilot programs"
    ],
    medium: [
      "Improve efficiency of existing plants",
      "Reduce transmission losses",
      "Adopt predictive maintenance",
      "Invest in hybrid renewable systems",
      "Employee training on energy conservation"
    ],
    low: [
      "Continue renewable expansion",
      "Share green technology with peers",
      "Set net-zero targets",
      "Invest in green hydrogen",
      "Regular sustainability reporting"
    ]
  },
  Healthcare: {
    high: [
      "Switch to energy-efficient medical equipment",
      "Install solar panels on hospital buildings",
      "Optimize HVAC in operation theaters",
      "Use LED lighting throughout facilities",
      "Implement medical waste reduction programs"
    ],
    medium: [
      "Regular energy audits of facilities",
      "Train staff on energy conservation",
      "Use telemedicine to reduce patient travel",
      "Optimize laundry and sterilization processes",
      "Install motion sensors in low-traffic areas"
    ],
    low: [
      "Continue sustainable practices",
      "Benchmark against green hospitals",
      "Set ambitious reduction targets",
      "Invest in green building certifications",
      "Regular sustainability reporting"
    ]
  },
  Education: {
    high: [
      "Switch to 100% renewable energy",
      "Install solar panels on campus buildings",
      "Implement campus-wide LED lighting",
      "Optimize online learning to reduce commute",
      "Use smart building management systems"
    ],
    medium: [
      "Encourage public transport for students",
      "Install bike racks and EV charging stations",
      "Reduce paper usage with digital systems",
      "Optimize heating and cooling schedules",
      "Regular energy audits"
    ],
    low: [
      "Continue green campus initiatives",
      "Set science-based targets",
      "Share best practices with other institutions",
      "Invest in sustainability research",
      "Regular carbon footprint assessments"
    ]
  }
};

/**
 * Get demo data for a specific sector
 * @param {string} sector - The industry sector
 * @returns {Array} Array of demo companies
 */
function getDemoDataForSector(sector) {
  return INDUSTRY_DEMO_DATA[sector] || INDUSTRY_DEMO_DATA.IT;
}

/**
 * Get all demo data across sectors
 * @returns {Array} All demo companies
 */
function getAllDemoData() {
  return Object.values(INDUSTRY_DEMO_DATA).flat();
}

/**
 * Get benchmark thresholds for a sector
 * @param {string} sector - The industry sector
 * @returns {Object} Benchmark thresholds
 */
function getBenchmarksForSector(sector) {
  return SECTOR_BENCHMARKS[sector] || SECTOR_BENCHMARKS.IT;
}

/**
 * Get best practices for a sector and emission level
 * @param {string} sector - The industry sector
 * @param {string} level - Emission level (high, medium, low)
 * @returns {Array} Best practice recommendations
 */
function getBestPractices(sector, level = 'medium') {
  const practices = BEST_PRACTICES_BY_SECTOR[sector] || BEST_PRACTICES_BY_SECTOR.IT;
  return practices[level] || practices.medium;
}

/**
 * Calculate percentile ranking within demo dataset
 * @param {number} emissionPerEmployee - Organization's emission per employee
 * @param {string} sector - The industry sector
 * @returns {number} Percentile (0-100)
 */
function calculateDemoPercentile(emissionPerEmployee, sector) {
  const sectorData = getDemoDataForSector(sector);
  const sorted = sectorData.map(c => c.emissionPerEmployee).sort((a, b) => a - b);
  
  let rank = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (emissionPerEmployee <= sorted[i]) {
      rank = i;
      break;
    }
  }
  
  return Math.round((rank / sorted.length) * 100);
}

/**
 * Get performance category based on percentile
 * @param {number} percentile - Percentile score (0-100)
 * @returns {string} Performance category
 */
function getPerformanceCategory(percentile) {
  if (percentile <= 10) return 'Top Performer';
  if (percentile <= 25) return 'Above Average';
  if (percentile <= 50) return 'Average';
  if (percentile <= 75) return 'Below Average';
  return 'Needs Improvement';
}

module.exports = {
  INDUSTRY_DEMO_DATA,
  SECTOR_BENCHMARKS,
  BEST_PRACTICES_BY_SECTOR,
  getDemoDataForSector,
  getAllDemoData,
  getBenchmarksForSector,
  getBestPractices,
  calculateDemoPercentile,
  getPerformanceCategory
};
