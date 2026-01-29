# Quick Fix Script for Frontend URLs

## Files with Hardcoded localhost:5000

### Organization Pages (High Priority)

#### 1. OrgDashboard.jsx
**Lines to update**: 32, 55, 80, 127, 156

**Import needed**:
```javascript
import { API_ENDPOINTS } from '../../config/api.config';
```

**Replacements**:
- Line 32: `'http://localhost:5000/api/org/dashboard'` → `API_ENDPOINTS.ORG.DASHBOARD`
- Line 55: `'http://localhost:5000/api/org/missing-data'` → `API_ENDPOINTS.ORG.MISSING_DATA`
- Line 80: `'http://localhost:5000/api/org/predict'` → `API_ENDPOINTS.ORG.PREDICT`
- Line 127: `'http://localhost:5000/api/org/save-prediction'` → `API_ENDPOINTS.ORG.SAVE_PREDICTION`
- Line 156: `'http://localhost:5000/api/org/fill-missing'` → `API_ENDPOINTS.ORG.FILL_MISSING`

#### 2. OrgCarbonCredits.jsx
**Lines to update**: 53, 66, 102, 134, 166

**Replacements**:
- `'http://localhost:5000/api/org/carbon-credits'` → `API_ENDPOINTS.ORG.CARBON_CREDITS`
- `'http://localhost:5000/api/org/dashboard'` → `API_ENDPOINTS.ORG.DASHBOARD`
- `'http://localhost:5000/api/org/carbon-credits/earn'` → `` `${API_ENDPOINTS.ORG.CARBON_CREDITS}/earn` ``
- `'http://localhost:5000/api/org/carbon-credits/purchase'` → `` `${API_ENDPOINTS.ORG.CARBON_CREDITS}/purchase` ``
- `'http://localhost:5000/api/org/carbon-credits/use'` → `` `${API_ENDPOINTS.ORG.CARBON_CREDITS}/use` ``

#### 3. OrgCompare.jsx
**Lines to update**: 31-35, 64

**Replacements**:
- Line 31: `'http://localhost:5000/api/organization/leaderboard'` → `API_ENDPOINTS.ORGANIZATION.LEADERBOARD`
- Line 32: `'http://localhost:5000/api/org/peers'` → `API_ENDPOINTS.ORG.PEERS`
- Line 33: `'http://localhost:5000/api/org/benchmarks'` → `API_ENDPOINTS.ORG.BENCHMARKS`
- Line 34: `'http://localhost:5000/api/organization/compare/percentile'` → `` `${API_ENDPOINTS.ORGANIZATION.COMPARE}/percentile` ``
- Line 35: `'http://localhost:5000/api/organization/best-practices'` → `API_ENDPOINTS.ORGANIZATION.BEST_PRACTICES`
- Line 64: `'http://localhost:5000/api/org/prediction'` → `` `${API_ENDPOINTS.ORG.BASE}/prediction` ``

#### 4. OrgCalculate.jsx
**Line to update**: 198

**Replacement**:
- `'http://localhost:5000/api/org/save-calculation'` → `API_ENDPOINTS.ORG.CALCULATE`

#### 5. OrgLogActivity.jsx
**Line to update**: 23

**Replacement**:
- `'http://localhost:5000/api/org/activities?'` → `` `${API_ENDPOINTS.ORG.ACTIVITIES}?` ``

### Government Pages

#### 6. GovDashboard.jsx
**Line to update**: 46

**Already partially correct!**
```javascript
`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/gov/dashboard`
```

**Improvement**:
```javascript
API_ENDPOINTS.GOV.DASHBOARD
```

#### 7. GovReports.jsx
**Line to update**: 24

**Already partially correct!**
```javascript
`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/gov/reports/generate`
```

**Improvement**:
```javascript
`${API_ENDPOINTS.GOV.REPORTS}/generate`
```

### Individual Pages

#### 8. LeaderboardPage.jsx
**Line to update**: 33

**Replacement**:
```javascript
// Before
`http://localhost:5000/api/activities/leaderboard?period=${period}`

// After
`${API_ENDPOINTS.ACTIVITIES}/leaderboard?period=${period}`
```

---

## Automated Fix (Optional)

If you want to automate this with a script:

### PowerShell Script (Windows)
```powershell
# Search for all hardcoded URLs
Get-ChildItem -Path "frontend/src" -Recurse -Include *.jsx,*.js | 
  Select-String "http://localhost:5000" | 
  Select-Object Path, LineNumber, Line | 
  Format-Table -AutoSize
```

### Manual Fix Priority
1. ✅ Organization pages (most critical for demo)
2. ✅ Government pages (already partially done)
3. ✅ Individual pages (lowest priority)

---

## Testing After Update

```javascript
// In browser console
console.log(process.env.REACT_APP_API_BASE_URL);
// Should show: https://carbonmeter-backend.onrender.com (production)
// Or: http://localhost:5000 (development)
```

---

## Example Complete Fix

### OrgDashboard.jsx - Before & After

**Before:**
```javascript
const fetchDashboardData = async () => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/org/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    // ...
  }
};
```

**After:**
```javascript
import { API_ENDPOINTS } from '../../config/api.config';

const fetchDashboardData = async () => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const response = await fetch(API_ENDPOINTS.ORG.DASHBOARD, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    // ...
  }
};
```

---

**Estimated Time**: 30 minutes to update all files  
**Files**: 8 files total  
**Lines**: ~20 replacements
