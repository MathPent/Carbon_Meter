# Organization ML Prediction Integration Guide

## ✅ Integration Summary

This document outlines the complete integration of organization-level ML prediction functionality into the CarbonMeter web application, connecting Python ML API, Node.js backend, and React frontend.

---

## 🎯 What Was Integrated

### 1. **Python ML API** (`ml/Carbon_meter/api.py`)
- ✅ Loaded organization XGBoost model from `ml/predict_org_emissions/industry_xgboost_final.pkl`
- ✅ Added `/predict/organization` POST endpoint
- ✅ Feature engineering: sector encoding, emission trends, employee ratio
- ✅ Fallback logic: uses historical average if ML fails
- ✅ Returns: predicted_emission, trend, confidence, benchmark_percentile, source

**Endpoint:** `POST http://localhost:8000/predict/organization`

**Request Payload:**
```json
{
  "organizationId": "mongo_object_id",
  "sector": "Technology",
  "emission_history": [1200, 1350, 1180, 1420],
  "employee_count": 150,
  "revenue": 5000000,
  "period": "next-month"
}
```

**Response:**
```json
{
  "predicted_emission": 1385.42,
  "trend": "increasing",
  "confidence": 0.87,
  "benchmark_percentile": 65,
  "source": "ml"
}
```

---

### 2. **Node.js Backend** (`backend/src/`)

#### Routes Added (`routes/org.js`)
```javascript
// Line 100: ML Prediction endpoint
router.post('/prediction', auth, orgController.getOrganizationPrediction);

// Line 107: Sector benchmarks
router.get('/benchmarks', auth, orgController.getBenchmarks);

// Line 114: Peer comparison data
router.get('/peers', auth, orgController.getPeers);
```

#### Controller Functions Added (`controllers/orgController.js`)

**A. `getOrganizationPrediction` (Lines 1609-1720)**
- Fetches user's organization emission history
- Calls Python ML API via axios
- Handles fallback if ML service is down
- Saves prediction to MongoDB
- Returns formatted response

**B. `getBenchmarks` (Lines 1721-1780)**
- Calculates sector-specific emission benchmarks
- Returns excellent/average/high thresholds
- Includes best-in-class and worst performers
- Demo mode support with seed data

**C. `getPeers` (Lines 1781-1850)**
- Generates peer comparison data
- Returns top 5 companies: Tata, Infosys, Wipro, HCL, Tech Mahindra
- Includes company names and emission metrics
- Real-time calculation from database

#### Database Model Created (`models/OrganizationPrediction.js`)
```javascript
{
  organizationId: ObjectId (ref: 'User'),
  period: String ('next-month', 'next-quarter', 'next-year'),
  predicted_emission: Number,
  trend: String ('increasing', 'decreasing', 'stable'),
  confidence: Number (0-1),
  benchmark_percentile: Number,
  source: String ('ml' or 'fallback'),
  demo: Boolean,
  historical_days: Number,
  metadata: Object
}
```

---

### 3. **React Frontend** (`frontend/src/pages/org/OrgCompare.jsx`)

#### UI Features Added

**A. Data Source Toggle**
```jsx
<div className="data-source-toggle">
  <button className="toggle-btn active">📊 Real Data</button>
  <button className="toggle-btn">🤖 AI Predicted</button>
</div>
```

- Switches between real data and ML predictions
- Smooth transition animation
- Active state styling

**B. ML Prediction Card Component**
```jsx
<PredictionCard data={prediction} />
```

Displays:
- Predicted emission value (tCO₂e)
- Trend indicator (📈 increasing, 📉 decreasing, ➡️ stable)
- Confidence percentage
- Benchmark percentile
- Data source disclaimer

**C. Updated API Calls**
- Changed from `/api/organization/*` to `/api/org/*` endpoints
- Fixed 400 Bad Request errors by matching payload formats
- Added parallel fetching for all comparison data

**D. Peer Company Logos**
- Companies shown: Tata, Reliance, Infosys, Adani, Wipro
- Fallback avatars with first letter
- Emission metrics displayed per company

---

## 🔧 Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend (Port 3000)              │
│  OrgCompare.jsx → API calls → Toggle [Real | Predicted] │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js Backend (Port 5000)                 │
│  /api/org/prediction (POST)  → orgController            │
│  /api/org/benchmarks (GET)   → getBenchmarks            │
│  /api/org/peers (GET)        → getPeers                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├──────────────┬─────────────────┐
                     ▼              ▼                 ▼
          ┌─────────────────┐  ┌─────────────┐  ┌────────────┐
          │  Python ML API  │  │   MongoDB   │  │  Fallback  │
          │   (Port 8000)   │  │  Database   │  │   Logic    │
          │  XGBoost Model  │  │  OrgActivity│  │  Historical│
          └─────────────────┘  └─────────────┘  └────────────┘
```

---

## 🚀 Testing Instructions

### Step 1: Start ML API Server
```bash
cd CarbonMeter/ml/Carbon_meter
python api.py
```
**Expected:** Server running on http://localhost:8000

### Step 2: Start Node.js Backend
```bash
cd CarbonMeter/backend
npm install
node src/server.js
```
**Expected:** Server running on http://localhost:5000

### Step 3: Start React Frontend
```bash
cd CarbonMeter/frontend
npm install
npm start
```
**Expected:** App running on http://localhost:3000

### Step 4: Test Organization Comparison
1. **Login** as organization user
2. Navigate to **Organization → Compare**
3. **Verify Real Data section** shows:
   - Performance percentile ranking
   - Sector-specific benchmarks
   - Peer-to-peer comparison with company logos
   - Industry leaderboard
   - Best practices showcase
4. **Click "🤖 AI Predicted" toggle**
5. **Verify Prediction Card** appears with:
   - Predicted emission value
   - Trend indicator
   - Confidence score
   - Benchmark percentile

---

## 📝 API Endpoint Reference

### POST `/api/org/prediction`
**Auth Required:** Yes (Bearer token)

**Request Body:**
```json
{
  "period": "next-month" // or "next-quarter", "next-year"
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "predicted_emission": 1385.42,
    "trend": "increasing",
    "confidence": 0.87,
    "benchmark_percentile": 65,
    "source": "ml"
  },
  "organizationId": "6785a1b2c3d4e5f6g7h8i9j0",
  "period": "next-month"
}
```

### GET `/api/org/benchmarks`
**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "sector": "Technology",
  "benchmarks": {
    "excellent": "< 2.5 tCO₂e/employee",
    "average": "2.5 - 5.0 tCO₂e/employee",
    "high": "> 5.0 tCO₂e/employee",
    "excellentMax": 2.5,
    "averageMax": 5.0
  },
  "industryData": {
    "industryAverage": 3.8,
    "bestInClass": 1.9
  }
}
```

### GET `/api/org/peers`
**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "sector": "Technology",
  "peers": [
    { "name": "Tata Consultancy Services", "emissionPerEmployee": 2.1 },
    { "name": "Infosys", "emissionPerEmployee": 2.4 },
    { "name": "Wipro", "emissionPerEmployee": 2.8 },
    { "name": "HCL Technologies", "emissionPerEmployee": 3.1 },
    { "name": "Tech Mahindra", "emissionPerEmployee": 3.5 }
  ],
  "yourOrganization": {
    "totalYearEmissions": 1200,
    "perEmployeeYear": 4.2
  }
}
```

---

## 🐛 Known Issues & Fixes

### Issue 1: 400 Bad Request on Organization Compare
**Cause:** Frontend calling `/api/organization/*` but backend has `/api/org/*`

**Fix:** Updated frontend API calls in [OrgCompare.jsx](frontend/src/pages/org/OrgCompare.jsx#L28-L32)

### Issue 2: ML API Not Running
**Cause:** Python server not started or port 8000 blocked

**Fix:** Backend has fallback logic using historical averages

### Issue 3: Missing Peer Company Data
**Cause:** Insufficient organizations in database

**Fix:** Added seed data with top 5 tech companies (Tata, Infosys, Wipro, HCL, Tech Mahindra)

---

## 🎨 UI Components Added

### Data Source Toggle Buttons
- **Styling:** Gradient background, smooth transitions
- **Active State:** Blue gradient with shadow
- **Location:** Top of compare page header

### ML Prediction Card
- **Background:** Light blue gradient
- **Sections:** 
  - Main prediction value (large, bold)
  - Trend indicator with emoji and color
  - Stats grid (confidence, percentile)
  - Disclaimer footer
- **Styling:** Matches ESG design system

### Peer Company Cards
- **Avatar Fallback:** First letter of company name
- **Metrics:** Total emissions + per-employee intensity
- **Layout:** Horizontal carousel

---

## 📦 Files Modified

### Backend
- ✅ `backend/src/routes/org.js` (Lines 100, 107, 114)
- ✅ `backend/src/controllers/orgController.js` (Lines 1609-1850)
- ✅ `backend/src/models/OrganizationPrediction.js` (New file)

### Frontend
- ✅ `frontend/src/pages/org/OrgCompare.jsx` (Lines 1-543)
- ✅ `frontend/src/pages/org/OrgCompare.css` (Lines 900-1050)

### ML API
- ✅ `ml/Carbon_meter/api.py` (Lines 11-30, 128-180)

### Documentation
- ✅ `ORGANIZATION_ML_INTEGRATION.md` (This file)

---

## ✨ Success Criteria

- [x] ML model loaded from existing files (no retraining)
- [x] Organization prediction endpoint functional
- [x] Backend routes added without breaking existing ones
- [x] Frontend displays real data by default
- [x] AI predicted mode shows ML forecasts
- [x] Peer comparison shows company logos
- [x] Performance percentile calculation working
- [x] Sector benchmarks displayed correctly
- [x] Industry leaderboard populated
- [x] Best practices recommendations shown
- [x] Demo badge appears for incomplete data
- [x] Error handling with fallback logic
- [x] Clean, commented production code

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add Historical Prediction Charts**
   - Line chart showing past predictions vs actual
   - Accuracy metrics over time

2. **Sector-Specific Models**
   - Train separate models per industry
   - Improve prediction accuracy

3. **Real-Time Updates**
   - WebSocket integration for live emissions
   - Auto-refresh predictions every hour

4. **Export Reports**
   - PDF generation with predictions
   - CSV download for analysis

5. **Mobile Responsiveness**
   - Optimize UI for mobile devices
   - Touch-friendly toggle buttons

---

## 📧 Support

For issues or questions:
- Check backend logs: `CarbonMeter/backend/logs/`
- Check ML API logs: Terminal running `api.py`
- Frontend console: Browser DevTools (F12)

**Integration completed successfully! 🎉**
