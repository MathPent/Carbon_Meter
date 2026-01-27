# CarbonMeter ML Integration - Implementation Summary

## 🎯 Project Overview

Successfully integrated a Python ML prediction system into the CarbonMeter React + Node.js + MongoDB web application for hackathon demo. The system predicts missing carbon emission days using behavioral ML while maintaining data integrity and providing clear visual distinction.

---

## 📁 Files Created/Modified

### New Files Created (7)

1. **`ml/api.py`** - Flask ML API (Port 5001)
   - Health check endpoint
   - Prediction endpoint with confidence levels
   - Robust model loading from multiple paths
   - CORS enabled for local development
   - Safety checks (NaN, Infinity, negative values)

2. **`backend/src/routes/prediction.js`** - Node backend routes
   - GET `/missing-days` - Find dates without logs
   - POST `/predict-missing-day` - Get ML prediction
   - POST `/save-predicted-emission` - Save to DB + CSV
   - Safe CSV append with blank line handling
   - Duplicate prevention

3. **`frontend/src/components/dashboard/PredictionCard.jsx`** - Prediction UI
   - Missing days list
   - Predict button per date
   - Preview with confidence badges
   - Confirm & Save workflow
   - Error handling + retry

4. **`frontend/src/components/dashboard/PredictionCard.css`** - Prediction styles
   - Purple gradient for results
   - Confidence badges (low/medium/high)
   - Loading states
   - Responsive design

5. **`ml/test_api.py`** - Test suite for ML API
   - Health check test
   - Prediction test
   - Confidence level validation
   - Edge case testing

6. **`ml/manual_calculation/carbonmeter_daily_log.csv`** - Data file
   - CSV header with 12 columns
   - Predictions appended with `estimated=1`

7. **`ML_INTEGRATION_GUIDE.md`** - Complete documentation
   - Startup commands
   - API endpoints
   - Testing procedures
   - Demo script for judges

### Modified Files (6)

1. **`ml/requirements.txt`**
   - Added: flask, flask-cors, requests

2. **`backend/src/server.js`**
   - Added prediction route: `/api/prediction`

3. **`backend/src/models/Activity.js`**
   - Added logType: `'ML Predicted'`

4. **`frontend/src/pages/DashboardPage.jsx`**
   - Added PredictionCard component
   - Added data toggle (Real vs Predicted)
   - Import PredictionCard

5. **`frontend/src/pages/DashboardPage.css`**
   - Added toggle button styles
   - Data view toggle layout

6. **`frontend/src/components/dashboard/ActivityLog.jsx`**
   - Added ML predicted badge conditional
   - Visual distinction for predicted items

7. **`frontend/src/components/dashboard/ActivityLog.css`**
   - Added `.predicted` class with purple gradient
   - Added `.ml-badge` styles with gradient
   - Dashed border for predictions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│                   (Port 3000)                           │
│  - PredictionCard component                             │
│  - Toggle: Real vs Predicted data                       │
│  - Visual distinction for ML items                      │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/REST
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js Backend API                        │
│                   (Port 5000)                           │
│  - /api/prediction/missing-days                         │
│  - /api/prediction/predict-missing-day                  │
│  - /api/prediction/save-predicted-emission              │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           │ HTTP POST                │ MongoDB
           ▼                          ▼
┌────────────────────┐      ┌──────────────────┐
│   Python ML API    │      │   MongoDB Atlas  │
│    (Port 5001)     │      │  - Activities    │
│  - /health         │      │  - Users         │
│  - /predict-missing│      └──────────────────┘
└────────┬───────────┘
         │
         ▼
┌────────────────────┐      ┌──────────────────┐
│  ML Model (.pkl)   │      │   CSV File       │
│  - XGBoost model   │      │  - Predictions   │
│  - Joblib loaded   │      │  - estimated=1   │
└────────────────────┘      └──────────────────┘
```

---

## 🔑 Key Features

### 1. **No Auto-Save**

✅ All predictions require explicit user confirmation

- Preview shown first
- User must click "Confirm & Save"
- Can cancel without saving

### 2. **Visual Distinction**

✅ ML predicted items clearly identifiable:

- Purple gradient background
- Dashed border (not solid)
- "🤖 ML Predicted" badge
- Source: "Behavioral Prediction"

### 3. **Data Integrity**

✅ Cannot overwrite existing logs:

- Duplicate check on date + userId
- Returns 409 Conflict if date exists
- Maintains separation of real vs predicted

### 4. **Confidence Levels** (Explainable)

- **Low**: 1 day of history (⚠️)
- **Medium**: 2-4 days of history (📊)
- **High**: 5+ days of history (✅)

### 5. **Toggle for Judges**

✅ Dashboard has prominent toggle:

- "📊 Real Data Only" (default)
- "🤖 Include Predicted"
- Proves data separation

### 6. **Stable Error Handling**

✅ Graceful fallbacks:

- ML API down → uses recent average
- No history → returns reasonable default
- Invalid input → friendly error messages

---

## 📊 Database Schema

### MongoDB Activity Document (Updated)

```javascript
{
  userId: ObjectId,
  category: "Comprehensive",
  logType: "ML Predicted",  // NEW ENUM VALUE
  description: "Behavioral prediction based on recent activity patterns",
  carbonEmission: 11.2,
  date: ISODate("2026-01-25"),
  source: "Behavioral Prediction",
  metadata: {
    isPredicted: true,
    predictionDate: ISODate()
  },
  comprehensiveData: {
    breakdown: {
      transport: 0,
      electricity: 0,
      food: 0,
      waste: 0,
      total: 11.2
    },
    questionnaireType: "ml_predicted"
  }
}
```

### CSV Format

```csv
date,transport_mode,public_transport_ratio,transport_co2,electricity_co2,cooking_co2,food_co2,waste_co2,digital_co2,avoided_co2,total_co2,estimated
2026-01-25,Mixed,0.6,0.0,0.0,0.0,0.0,0.0,0.0,0.0,11.20,1
```

- `estimated=0`: Manual/real log
- `estimated=1`: ML predicted (confirmed)

---

## 🔌 API Endpoints

### Python ML API (Port 5001)

**GET /health**

```json
Response:
{
  "ok": true,
  "service": "carbonmeter-ml",
  "modelLoaded": true
}
```

**POST /predict-missing**

```json
Request:
{
  "last_n_days": [12.3, 10.8, 11.5]
}

Response:
{
  "predicted_co2": 11.2,
  "confidence": "medium",
  "days_used": 3
}
```

### Node Backend (Port 5000)

**GET /api/prediction/missing-days**

```json
Response:
{
  "success": true,
  "missingDays": ["2026-01-25", "2026-01-24", ...]
}
```

**POST /api/prediction/predict-missing-day**

```json
Request: { "date": "2026-01-25" }

Response:
{
  "success": true,
  "predictedEmission": 11.2,
  "confidence": "medium",
  "daysUsed": 3
}
```

**POST /api/prediction/save-predicted-emission**

```json
Request:
{
  "date": "2026-01-25",
  "predictedEmission": 11.2
}

Response:
{
  "success": true,
  "message": "Prediction saved successfully",
  "activity": { ... }
}
```

---

## 🧪 Testing

### ML API Test

```bash
cd ml
python test_api.py
```

Tests:

- ✅ Health check
- ✅ Prediction endpoint
- ✅ Confidence levels (1, 2-4, 5+ days)
- ✅ Edge cases (empty array, non-numeric)

### Manual Testing

1. Start all services
2. Login to dashboard
3. Check prediction card appears
4. Predict a missing day
5. Confirm and save
6. Toggle "Include Predicted"
7. Verify visual distinction

---

## 🎬 Demo Script for Judges

### Opening (30 seconds)

"CarbonMeter helps individuals track their carbon footprint. We noticed users forget to log activities, creating gaps in data. We integrated ML to predict missing days while maintaining transparency."

### Show Problem (30 seconds)

- Point to missing days in calendar
- "These are dates without logs"
- "ML analyzes recent patterns to predict"

### Demonstrate Feature (60 seconds)

1. Click "Predict" on missing date
2. Show prediction:
   - "Based on 4 recent days"
   - "Medium confidence"
   - "Estimated 11.2 kg CO₂"
3. Explain: "Must confirm before saving"
4. Click "Confirm & Save"

### Show Visual Distinction (45 seconds)

1. Toggle to "Include Predicted"
2. Point out purple cards
3. Show "ML Predicted" badge
4. Explain: "Clearly separable from real data"

### Technical Points (30 seconds)

- React frontend
- Node.js backend
- Separate Python ML API (port 5001)
- XGBoost model
- Data saved to MongoDB + CSV

### Safety Features (30 seconds)

- Cannot overwrite manual logs
- Requires confirmation
- Confidence levels explained
- Toggle proves separation

**Total: ~3.5 minutes**

---

## ✅ Acceptance Criteria - All Met

- ✅ No ERR_CONNECTION_REFUSED on ports 5000/5001
- ✅ Clicking Predict shows predicted number + confidence
- ✅ Confirm & Save writes to MongoDB
- ✅ Confirm & Save appends CSV with `estimated=1`
- ✅ Dashboard updates with prediction
- ✅ Toggle clearly differentiates real vs predicted
- ✅ ML predictions have visual distinction
- ✅ Cannot overwrite existing logs
- ✅ No auto-save (requires confirmation)
- ✅ Prediction works with 1-2 days of history
- ✅ ML API down → graceful fallback
- ✅ No console spam or white screens

---

## 🚀 Startup Commands

### Windows Quick Start

```bash
# Terminal 1: ML API
cd ml
pip install -r requirements.txt
python api.py

# Terminal 2: Backend
cd backend
npm install
npm start

# Terminal 3: Frontend
cd frontend
npm install
npm start
```

### Verify Services

- ML API: http://localhost:5001/health
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000

---

## 📝 Important Notes

### What Was NOT Changed (Per Requirements)

- ❌ Google authentication (unchanged)
- ❌ Manual log activity flow (unchanged)
- ❌ Emission formulas (unchanged)
- ❌ Existing dashboard layout (only added card + toggle)
- ❌ Leaderboard/badges logic (unchanged)
- ❌ No auto-save (requires confirmation)
- ❌ No Python in Node.js (separate API)
- ❌ No Python in frontend (separate API)

### Architecture Decisions

1. **Separate Python API**: Clean separation, easier debugging
2. **Port 5001**: Standard convention, avoids conflicts
3. **No auto-save**: User control, transparency
4. **Confidence levels**: Simple rules, explainable
5. **Visual distinction**: Judge requirement, accessibility
6. **Toggle prominent**: Proves data separation
7. **CSV append**: Maintains compatibility with existing model training

---

## 🎉 Result

**Stable, demo-ready ML integration that:**

- Predicts missing carbon emission days
- Requires user confirmation
- Maintains data integrity
- Provides clear visual distinction
- Works even with minimal history
- Handles errors gracefully
- Separates real from predicted data
- Ready for hackathon judging

**All hard rules followed. All mandatory architecture requirements met. All acceptance criteria passed.**

---

**Status: ✅ READY FOR DEMO**
