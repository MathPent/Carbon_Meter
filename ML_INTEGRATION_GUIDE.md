# CarbonMeter ML Integration - Complete Setup Guide

## 🚀 Quick Start (Windows)

### 1. Start Python ML API (Port 5001)

```bash
cd ml
pip install -r requirements.txt
python api.py
```

**Expected Output:**

```
============================================================
🚀 CarbonMeter ML API Starting...
============================================================
Model Status: ✅ Loaded
Port: 5001
============================================================

 * Running on http://0.0.0.0:5001
```

**Health Check:**
Open browser: http://localhost:5001/health

Should return:

```json
{
  "ok": true,
  "service": "carbonmeter-ml",
  "modelLoaded": true,
  "port": 5001
}
```

---

### 2. Start Node Backend (Port 5000)

```bash
cd backend
npm install
npm start
```

**Expected Output:**

```
✅ MongoDB Atlas connected successfully
🚀 Server running on port 5000
```

**Health Check:**
Open browser: http://localhost:5000/api/health

Should return:

```json
{
  "status": "Backend is running",
  "database": "MongoDB Atlas connected"
}
```

---

### 3. Start React Frontend (Port 3000)

```bash
cd frontend
npm install
npm start
```

**Expected Output:**

```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3000
```

---

## 🎯 Testing the ML Integration

### Step 1: Login to Dashboard

1. Open http://localhost:3000
2. Login with your account
3. Navigate to **Dashboard**

### Step 2: Find the Prediction Card

Look for the **"🔮 Missing Day Prediction"** card at the top of the Overview tab.

### Step 3: Predict a Missing Day

1. Click **"Predict"** on any missing date
2. Review the prediction:
   - Predicted emission value
   - Confidence level (low/medium/high)
   - Number of days used
   - Explanation

### Step 4: Confirm & Save

1. Click **"Confirm & Save"**
2. Prediction is saved to MongoDB + CSV
3. Check **Log Activity** tab to see the new entry

### Step 5: Toggle Real vs Predicted Data

At the top of dashboard:

- **📊 Real Data Only** (default) - shows only manual logs
- **🤖 Include Predicted** - shows both manual and ML predictions

---

## 🔍 Demo Points for Judges

### 1. **Visual Distinction**

- ML predicted items have:
  - Purple gradient background
  - Dashed border
  - "🤖 ML Predicted" badge
  - Clearly labeled "Behavioral Prediction"

### 2. **No Auto-Save**

- Predictions require explicit confirmation
- Shows preview before saving
- Can cancel without saving

### 3. **Confidence Levels**

- **Low**: 1 day of history (⚠️)
- **Medium**: 2-4 days of history (📊)
- **High**: 5+ days of history (✅)

### 4. **Explainability**

- Shows how many days used for prediction
- Clear explanation of ML process
- Transparent about being an estimate

### 5. **Data Integrity**

- Cannot overwrite existing manual logs
- Predictions marked with `estimated=1` in CSV
- Separate logType in database

---

## 📋 API Endpoints

### Python ML API (Port 5001)

#### `GET /health`

Health check for ML service

**Response:**

```json
{
  "ok": true,
  "service": "carbonmeter-ml",
  "modelLoaded": true
}
```

#### `POST /predict-missing`

Predict emission based on recent history

**Request:**

```json
{
  "last_n_days": [12.3, 10.8, 11.5, 9.2]
}
```

**Response:**

```json
{
  "predicted_co2": 11.2,
  "confidence": "medium",
  "days_used": 4
}
```

---

### Node Backend (Port 5000)

#### `GET /api/prediction/missing-days`

Get list of missing dates

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "missingDays": ["2026-01-25", "2026-01-24", ...]
}
```

#### `POST /api/prediction/predict-missing-day`

Predict emission for specific date

**Request:**

```json
{
  "date": "2026-01-25"
}
```

**Response:**

```json
{
  "success": true,
  "predictedEmission": 11.2,
  "confidence": "medium",
  "daysUsed": 4
}
```

#### `POST /api/prediction/save-predicted-emission`

Save confirmed prediction

**Request:**

```json
{
  "date": "2026-01-25",
  "predictedEmission": 11.2
}
```

**Response:**

```json
{
  "success": true,
  "message": "Prediction saved successfully",
  "activity": { ... }
}
```

---

## 🗂️ File Structure

```
CarbonMeter/
├── ml/
│   ├── api.py                          # Flask ML API (NEW)
│   ├── requirements.txt                # Updated with Flask
│   ├── carbonmeter_behavioral_model.pkl
│   ├── model_rel/
│   │   └── carbonmeter_behavioral_model.pkl
│   └── manual_calculation/
│       └── carbonmeter_daily_log.csv   # Predictions appended here
│
├── backend/
│   └── src/
│       ├── server.js                   # Updated with prediction route
│       ├── models/
│       │   └── Activity.js             # Updated with ML Predicted logType
│       └── routes/
│           └── prediction.js           # NEW prediction routes
│
└── frontend/
    └── src/
        ├── pages/
        │   └── DashboardPage.jsx       # Updated with toggle + prediction card
        └── components/
            └── dashboard/
                ├── PredictionCard.jsx  # NEW ML prediction UI
                ├── PredictionCard.css
                ├── ActivityLog.jsx     # Updated with visual distinction
                └── ActivityLog.css     # Updated with predicted styles
```

---

## 🐛 Troubleshooting

### ML API Not Starting

**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**

```bash
cd ml
pip install -r requirements.txt
```

---

**Error:** `Model file not found`

**Solution:**
Check model exists at:

- `ml/carbonmeter_behavioral_model.pkl` OR
- `ml/model_rel/carbonmeter_behavioral_model.pkl`

---

### Backend Errors

**Error:** `Cannot find module '../routes/prediction'`

**Solution:**
Ensure `prediction.js` exists in `backend/src/routes/`

---

**Error:** `ERR_CONNECTION_REFUSED` on port 5001

**Solution:**

1. Check ML API is running: `http://localhost:5001/health`
2. Check firewall settings
3. Verify port 5001 is not in use

---

### Frontend Issues

**Error:** Prediction card not showing

**Solution:**

1. Check browser console for errors
2. Verify backend is running
3. Check authentication token is valid

---

**Error:** Toggle not working

**Solution:**
Clear browser cache and reload

---

## 📊 CSV Format

Predictions are appended to `ml/manual_calculation/carbonmeter_daily_log.csv`:

```csv
date,transport_mode,public_transport_ratio,transport_co2,electricity_co2,cooking_co2,food_co2,waste_co2,digital_co2,avoided_co2,total_co2,estimated
2026-01-25,Mixed,0.6,0.0,0.0,0.0,0.0,0.0,0.0,0.0,11.20,1
```

**Key Fields:**

- `estimated=0`: Real/manual log
- `estimated=1`: ML predicted (confirmed by user)

---

## ✅ Acceptance Checklist

- [ ] ML API starts on port 5001 without errors
- [ ] Backend starts on port 5000 without errors
- [ ] Frontend starts on port 3000 without errors
- [ ] Health checks return valid JSON
- [ ] Prediction card visible in dashboard
- [ ] Can predict missing days
- [ ] Predictions show confidence levels
- [ ] Confirm & Save writes to MongoDB
- [ ] Confirm & Save appends to CSV with `estimated=1`
- [ ] Toggle clearly differentiates real vs predicted
- [ ] ML predicted items have visual distinction (purple + dashed border)
- [ ] Cannot overwrite existing manual logs
- [ ] No console errors during prediction flow

---

## 🎉 Demo Script

**For Judges:**

1. **Show Dashboard**
   - Point out the data toggle at top
   - Currently shows "Real Data Only"

2. **Explain Problem**
   - "Users forget to log activities"
   - "We use ML to predict missing days"

3. **Demonstrate Prediction**
   - Click "Predict" on missing date
   - Show prediction with confidence
   - Explain: "Based on 4 recent days of activity"

4. **Highlight Safety**
   - "Must confirm before saving"
   - "Cannot overwrite existing logs"
   - "Clearly marked as ML predicted"

5. **Show Visual Distinction**
   - Toggle to "Include Predicted"
   - Point out purple cards with dashed borders
   - Show "🤖 ML Predicted" badge

6. **Explain Architecture**
   - React frontend
   - Node.js backend API
   - Separate Python ML API on port 5001
   - Clean separation of concerns

7. **Show Data Integrity**
   - Open activity log
   - Filter by category
   - Show predictions are separable from real data

---

## 🔗 Important URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **ML API:** http://localhost:5001
- **Health Checks:**
  - ML: http://localhost:5001/health
  - Backend: http://localhost:5000/api/health

---

## 📝 Notes

- All predictions require user confirmation
- Predictions use simple statistical features (mean, std, min, max)
- Confidence based on number of historical days available
- CSV append is safe (handles blank lines)
- MongoDB stores predictions with `logType: "ML Predicted"`
- Toggle clearly separates real vs predicted data for judges

---

**Ready to demo! 🚀**
