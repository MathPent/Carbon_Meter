# Quick Start Guide - Testing Organization ML Integration

## 🚀 Launch Sequence

### Terminal 1: Python ML API
```bash
cd CarbonMeter\ml\Carbon_meter
python api.py
```
**Expected Output:**
```
✓ Individual model loaded from carbonmeter_behavioral_model.pkl
✓ Organization model loaded from predict_org_emissions/industry_xgboost_final.pkl
 * Running on http://127.0.0.1:8000
```

### Terminal 2: Node.js Backend
```bash
cd CarbonMeter\backend
node src\server.js
```
**Expected Output:**
```
✓ MongoDB connected
✓ Server running on http://localhost:5000
✓ Organization routes registered at /api/org
```

### Terminal 3: React Frontend
```bash
cd CarbonMeter\frontend
npm start
```
**Expected Output:**
```
✓ Compiled successfully!
✓ App running on http://localhost:3000
```

---

## 🧪 Test Checklist

### 1. Login as Organization User
- [ ] Navigate to http://localhost:3000
- [ ] Login with organization credentials
- [ ] Verify token stored in localStorage

### 2. Navigate to Compare Page
- [ ] Click "Organization" in navbar
- [ ] Click "Compare" tab
- [ ] Verify page loads without 400 errors

### 3. Test Real Data Mode (Default)
- [ ] Verify "📊 Real Data" button is active (blue)
- [ ] Check Performance Percentile card appears
- [ ] Check Sector Benchmarks card appears
- [ ] Check Peer Comparison shows company logos
- [ ] Check Industry Leaderboard populated
- [ ] Check Best Practices recommendations visible

### 4. Test AI Predicted Mode
- [ ] Click "🤖 AI Predicted" button
- [ ] Verify loading state appears briefly
- [ ] Check ML Prediction Card appears at top
- [ ] Verify predicted emission value displayed
- [ ] Check trend indicator (📈/📉/➡️) shows
- [ ] Verify confidence percentage appears
- [ ] Check benchmark percentile shown
- [ ] Verify disclaimer footer visible

### 5. Verify API Responses
**Open Browser DevTools → Network Tab:**

- [ ] `/api/org/peers` returns 200 OK
- [ ] `/api/org/benchmarks` returns 200 OK
- [ ] `/api/org/prediction` returns 200 OK (when in predicted mode)
- [ ] No 400 Bad Request errors
- [ ] No 404 Not Found errors

### 6. Test Error Handling
**Scenario A: ML API Down**
- [ ] Stop Python ML server (Ctrl+C in Terminal 1)
- [ ] Switch to "AI Predicted" mode
- [ ] Verify fallback message appears (not crash)
- [ ] Check console shows graceful error handling

**Scenario B: Insufficient Data**
- [ ] Login with new organization (no activities)
- [ ] Navigate to Compare page
- [ ] Verify empty state messages appear
- [ ] Check "Add emission data to see..." messages

---

## 📊 Sample Expected Results

### Benchmarks API Response
```json
{
  "success": true,
  "sector": "Technology",
  "benchmarks": {
    "excellent": "< 2.5 tCO₂e/employee",
    "average": "2.5 - 5.0 tCO₂e/employee",
    "high": "> 5.0 tCO₂e/employee"
  },
  "industryData": {
    "industryAverage": 3.8,
    "bestInClass": 1.9
  }
}
```

### Peers API Response
```json
{
  "success": true,
  "peers": [
    { "name": "Tata Consultancy Services", "emissionPerEmployee": 2.1 },
    { "name": "Infosys", "emissionPerEmployee": 2.4 },
    { "name": "Wipro", "emissionPerEmployee": 2.8 }
  ]
}
```

### Prediction API Response
```json
{
  "success": true,
  "prediction": {
    "predicted_emission": 1385.42,
    "trend": "increasing",
    "confidence": 0.87,
    "benchmark_percentile": 65,
    "source": "ml"
  }
}
```

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to load comparison data"
**Fix:** Check all 3 servers are running (Python, Node, React)

### Issue: Prediction card not appearing
**Fix:** Ensure you clicked "AI Predicted" toggle button

### Issue: "Network Error" in console
**Fix:** Verify backend server is on port 5000

### Issue: Empty peer comparison
**Fix:** Check MongoDB has organization activity data

### Issue: 400 Bad Request
**Fix:** Frontend API paths already updated to /api/org/*

---

## ✅ Success Indicators

When everything is working:
- ✅ All 3 servers running without errors
- ✅ Compare page loads in < 2 seconds
- ✅ Toggle switches smoothly between modes
- ✅ Prediction card shows real ML data (not fallback)
- ✅ Company logos/avatars visible in peer comparison
- ✅ Percentile ranking displays correct color (green/yellow/red)
- ✅ No console errors or warnings
- ✅ Demo badge appears when using seed data

---

## 📸 Screenshot Checklist

Take these screenshots for demo:
1. Real Data mode - Full compare page
2. AI Predicted mode - With prediction card
3. Peer comparison - Company logos visible
4. Leaderboard - Rankings populated
5. Toggle buttons - Active state styling
6. Network tab - Successful API calls (200 OK)

---

## 🎯 Demo Flow for Hackathon

**Script:**
1. "Here's our Carbon Meter organization dashboard"
2. "By default, we show real emission data from the database"
3. [Click AI Predicted] "With one click, we switch to ML-powered forecasts"
4. "Our XGBoost model predicts next month's emissions with 87% confidence"
5. "We compare against industry peers like Tata, Infosys, Wipro"
6. "The percentile ranking shows we're in the top 30% for our sector"
7. "Best practices are tailored to our emission level and industry"
8. [Toggle back] "Seamless switching between real and predicted data"

**Key Points:**
- Emphasize ML integration (XGBoost, feature engineering)
- Highlight peer comparison with real company benchmarks
- Show toggle functionality (hackathon-friendly UX)
- Mention fallback logic for reliability

---

**Integration Ready! 🎉**
