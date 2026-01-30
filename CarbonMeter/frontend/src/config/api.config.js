// API Configuration
// MUST set REACT_APP_API_URL environment variable
// Production: REACT_APP_API_URL=https://carbon-meter-kixz.onrender.com
// Local development: REACT_APP_API_URL=http://localhost:5000
const API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'REACT_APP_API_URL environment variable is not set. ' +
    'Please create a .env file with: REACT_APP_API_URL=https://carbon-meter-kixz.onrender.com (for production) ' +
    'or set it in your deployment platform (e.g., Netlify)'
  );
}

export const API_ENDPOINTS = {
  BASE: API_BASE_URL,
  API: `${API_BASE_URL}/api`,
  
  // Auth Endpoints
  AUTH: `${API_BASE_URL}/api/auth`,
  
  // Individual User Endpoints
  ACTIVITIES: `${API_BASE_URL}/api/activities`,
  DASHBOARD: `${API_BASE_URL}/api/dashboard`,
  
  // Organization Endpoints
  ORG: {
    BASE: `${API_BASE_URL}/api/org`,
    DASHBOARD: `${API_BASE_URL}/api/org/dashboard`,
    ACTIVITIES: `${API_BASE_URL}/api/org/activities`,
    CALCULATE: `${API_BASE_URL}/api/org/save-calculation`,
    PREDICT: `${API_BASE_URL}/api/org/predict`,
    SAVE_PREDICTION: `${API_BASE_URL}/api/org/save-prediction`,
    FILL_MISSING: `${API_BASE_URL}/api/org/fill-missing`,
    MISSING_DATA: `${API_BASE_URL}/api/org/missing-data`,
    CARBON_CREDITS: `${API_BASE_URL}/api/org/carbon-credits`,
    COMPARE: `${API_BASE_URL}/api/org`,
    PEERS: `${API_BASE_URL}/api/org/peers`,
    BENCHMARKS: `${API_BASE_URL}/api/org/benchmarks`,
  },
  
  // Government Endpoints
  GOV: {
    BASE: `${API_BASE_URL}/api/gov`,
    DASHBOARD: `${API_BASE_URL}/api/gov/dashboard`,
    REPORTS: `${API_BASE_URL}/api/gov/reports`,
    ANALYTICS: `${API_BASE_URL}/api/gov/analytics`,
  },
  
  // Organization Public Endpoints
  ORGANIZATION: {
    LEADERBOARD: `${API_BASE_URL}/api/organization/leaderboard`,
    COMPARE: `${API_BASE_URL}/api/organization/compare`,
    BEST_PRACTICES: `${API_BASE_URL}/api/organization/best-practices`,
  },
};

export default API_BASE_URL;
