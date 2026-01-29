# 🧪 Testing Guide: Organization AI Forecasting

## 📋 Complete Testing Checklist

### Phase 1: Python ML API (Port 8001)

#### ✅ Step 1: Start ML Server
```bash
cd ml\predict_org_emissions
START_ORG_ML_API.bat
```

**Expected Output:**
```
========================================
Starting ML API for Organization Predictions
Port: 8001
========================================
Activating virtual environment...
Installing/Updating dependencies...
Starting Flask ML API on http://localhost:8001
 * Running on http://127.0.0.1:8001
Model loaded successfully: industry_xgboost_final.pkl
```

#### ✅ Step 2: Test Health Check
```bash
curl http://localhost:8001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0"
}
```

#### ✅ Step 3: Test Industries List
```bash
curl http://localhost:8001/industries
```

**Expected Response:**
```json
{
  "industries": ["Cement", "Steel", "Power", "Chemicals", "Manufacturing"]
}
```

#### ✅ Step 4: Test Prediction Endpoint
Create file `test_prediction.json`:
```json
{
  "organization_id": "test_org_123",
  "industry": "Cement",
  "period": "next_30_days",
  "historical_data": []
}
```

Run test:
```bash
curl -X POST http://localhost:8001/predict/org ^
  -H "Content-Type: application/json" ^
  -d @test_prediction.json
```

**Expected Response:** JSON with predicted_emission, confidence, breakdown, recommendations

---

### Phase 2: Node.js Backend Integration (Port 5000)

#### ✅ Step 5: Start Backend Server
```bash
cd backend
npm start
```

**Expected Output:**
```
🚀 Server running on port 5000
MongoDB Atlas connected
```

#### ✅ Step 6: Test ML Status Check
```bash
curl http://localhost:5000/api/org/ml-status
```

**Expected Response:**
```json
{
  "success": true,
  "mlAvailable": true,
  "mlStatus": {
    "status": "healthy",
    "model_loaded": true
  }
}
```

#### ✅ Step 7: Test Prediction via Backend (Requires Auth)
```bash
# Get auth token first
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"org@test.com\",\"password\":\"test123\"}"

# Use token in prediction request
curl -X POST http://localhost:5000/api/org/predict ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"period\":\"next_30_days\",\"industry\":\"Manufacturing\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "prediction": {
    "organizationId": "...",
    "predictedEmission": 1250.50,
    "period": "next_30_days",
    "confidence": 0.75,
    "breakdown": {...},
    "recommendations": [...]
  },
  "fallback": false,
  "message": "Prediction generated successfully"
}
```

---

### Phase 3: React Frontend UI (Port 3000)

#### ✅ Step 8: Start Frontend
```bash
cd frontend
npm start
```

Browser opens at: `http://localhost:3000`

#### ✅ Step 9: Test Dashboard Access
1. Login as organization user
2. Navigate to: **Organization Dashboard**
3. Look for: **🔮 AI Emission Forecasting** section

#### ✅ Step 10: Test Prediction Generation
1. Click: **🤖 Show Prediction**
2. Select period: **📅 Next 30 Days**
3. Wait for loading: **⏳ Processing...**
4. Verify display shows:
   - ✅ Predicted Emission value (tCO₂e)
   - ✅ Confidence Level percentage
   - ✅ Industry name
   - ✅ Model Source (XGBoost ML or Fallback)
   - ✅ Scope breakdown bars
   - ✅ AI Recommendations list
   - ✅ Industry Insights grid

#### ✅ Step 11: Test Different Periods
- Click **📊 Next Quarter** (90 days)
- Click **📈 Next Year** (365 days)
- Verify predictions update correctly

#### ✅ Step 12: Test Fallback Mode
1. Stop ML server (port 8001)
2. Click **🔄 Generate New Prediction**
3. Verify:
   - ⚠️ **Fallback Calculation** badge appears
   - Alert: "Prediction generated using fallback calculation"
   - Prediction still displays with lower confidence

---

### Phase 4: Manufacturing Industry Tests

#### ✅ Step 13: Test Cement Industry
```json
{
  "industry": "Cement",
  "period": "next_30_days"
}
```

**Expected Insights:**
- Main Source: Clinker production (calcination)
- Scope 1: 62%
- Recommendations: Alternative fuels, blended cements

#### ✅ Step 14: Test Steel Industry
```json
{
  "industry": "Steel",
  "period": "next_30_days"
}
```

**Expected Insights:**
- Main Source: Blast furnace operations
- Scope 1: 70%
- Recommendations: Scrap-based EAF, hydrogen DRI

#### ✅ Step 15: Test Power Industry
```json
{
  "industry": "Power",
  "period": "next_30_days"
}
```

**Expected Insights:**
- Main Source: Coal combustion
- Scope 1: 98%
- Recommendations: Renewables, grid efficiency

#### ✅ Step 16: Test Chemicals Industry
```json
{
  "industry": "Chemicals",
  "period": "next_30_days"
}
```

**Expected Insights:**
- Main Source: Steam cracking
- Scope 1: 55%
- Recommendations: Renewable hydrogen, electrification

---

### Phase 5: Error Handling & Edge Cases

#### ✅ Step 17: No Historical Data
1. Create new org account with NO emission data
2. Generate prediction
3. Verify: Sample data is used, prediction generated

#### ✅ Step 18: ML Server Down
1. Stop ML server (port 8001)
2. Generate prediction
3. Verify: Fallback calculation works
4. Check: Alert shows "ML service unavailable"

#### ✅ Step 19: Network Timeout
1. Add delay to ML API (simulate slow network)
2. Generate prediction
3. Verify: 15-second timeout, then fallback

#### ✅ Step 20: Invalid Industry
```json
{
  "industry": "InvalidIndustry",
  "period": "next_30_days"
}
```

**Expected:** Defaults to "Manufacturing"

---

### Phase 6: Database Verification

#### ✅ Step 21: Check Prediction Saved
Open MongoDB Compass:
```
Database: carbon_meter
Collection: organizationpredictions
```

Verify document has:
- `organizationId`
- `predictedEmission`
- `confidence`
- `breakdown` (scope1, scope2)
- `recommendations` array
- `industryInsights` object
- `isFallback` boolean
- `createdAt` timestamp

#### ✅ Step 22: Check TTL Expiry
Document should have:
```javascript
expiresAt: Date (90 days from createdAt)
```

Verify TTL index exists on `expiresAt` field.

---

### Phase 7: Integration Tests

#### ✅ Step 23: Full Flow Test
1. **Calculate Emission** → Save to database
2. **Generate Prediction** → Calls ML API
3. **View Dashboard** → Shows both actual + predicted
4. **Compare Data** → Toggle Real vs Predicted

#### ✅ Step 24: Missing Data Auto-Fill
1. Calculate emissions for some days only (gaps exist)
2. Dashboard shows: "Missing Emission Data Detected"
3. Click: **🤖 Fill Missing Data with AI**
4. Verify: Gaps filled with `source: 'AI_ESTIMATED'`

#### ✅ Step 25: Multi-User Test
1. Create 2 org accounts
2. Generate predictions for both
3. Verify: Each gets separate predictions
4. No data leakage between orgs

---

## 🚨 Common Issues & Solutions

### Issue 1: ML Server Won't Start
**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**
```bash
cd ml\predict_org_emissions
pip install -r requirements.txt
```

### Issue 2: Port 8001 Already in Use
**Error:** `Address already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8001 | xargs kill -9
```

### Issue 3: Model File Not Found
**Error:** `FileNotFoundError: industry_xgboost_final.pkl`

**Solution:**
```bash
# Verify file exists
dir industry_xgboost_final.pkl

# If missing, check backup or regenerate
python actual_cal.py
```

### Issue 4: Backend Can't Connect to ML
**Error:** `ECONNREFUSED localhost:8001`

**Solution:**
1. Check ML server is running: `curl http://localhost:8001/health`
2. Check firewall settings
3. Verify ML_API_URL in `orgPrediction.js`

### Issue 5: Frontend Shows No Prediction
**Symptom:** Button works but no data displays

**Solution:**
1. Open DevTools Console
2. Check for errors
3. Verify API response in Network tab
4. Check prediction state in React DevTools

---

## ✅ Success Criteria

All tests pass if:

1. ✅ ML server starts on port 8001
2. ✅ Health check returns `model_loaded: true`
3. ✅ Prediction endpoint returns valid JSON
4. ✅ Backend can call ML API successfully
5. ✅ Frontend displays prediction with all fields
6. ✅ Scope breakdown bars render correctly
7. ✅ Recommendations list shows 3-5 items
8. ✅ Industry insights display 4 metrics
9. ✅ Fallback mode works when ML offline
10. ✅ Predictions save to MongoDB
11. ✅ TTL expiry set correctly (90 days)
12. ✅ Manufacturing industries show correct insights

---

## 📊 Performance Benchmarks

Expected timings:
- ML API prediction: < 500ms
- Backend + ML call: < 1 second
- Frontend UI update: < 2 seconds (total)
- Database save: < 200ms

---

## 🎯 Judge Demo Script

For hackathon demonstration:

1. **Show Architecture** (30 seconds)
   - "3-tier system: React → Node.js → Python ML"
   - "XGBoost model trained on industrial emissions"

2. **Live Prediction** (60 seconds)
   - Login as cement manufacturer
   - Click "Show Prediction"
   - Generate 30-day forecast
   - Highlight: Confidence 85%, Scope breakdown, Recommendations

3. **Manufacturing Focus** (30 seconds)
   - Switch to Steel industry
   - Show 70% Scope 1 emissions
   - Explain: "Blast furnace operations dominate"

4. **Fallback Demo** (30 seconds)
   - Stop ML server
   - Generate prediction
   - Show: "Still works with fallback calculation"

5. **Error Handling** (15 seconds)
   - Show: ML service status indicator
   - Explain: "Graceful degradation, always available"

---

**Total Testing Time:** ~2 hours  
**Critical Tests:** Steps 1-12, 17-18, 23  
**Optional Tests:** Steps 19-22, 24-25

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Status:** Ready for Testing
