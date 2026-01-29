# ⚡ Quick Start - Organization AI Forecasting

## 🚀 Start System (All Services)

### Windows
```bash
cd CarbonMeter
START_ALL.bat
```

This starts 4 services:
1. Individual ML API → `localhost:8000`
2. Organization ML API → `localhost:8001` ⭐ NEW
3. Node Backend → `localhost:5000`
4. React Frontend → `localhost:3000`

---

## ✅ Verify Services Running

### 1. Check Individual ML (8000)
```bash
curl http://localhost:8000/health
```

### 2. Check Organization ML (8001) ⭐ NEW
```bash
curl http://localhost:8001/health
```
Expected: `{"status": "healthy", "model_loaded": true}`

### 3. Check Backend (5000)
```bash
curl http://localhost:5000/api/health
```

### 4. Check Frontend (3000)
Open browser: `http://localhost:3000`

---

## 🧪 Test AI Prediction (2 min)

### Step 1: Login
- Go to `http://localhost:3000`
- Login with organization account

### Step 2: Navigate to Dashboard
- Click: **Organization Dashboard**

### Step 3: Generate Prediction
1. Find: **🔮 AI Emission Forecasting** section
2. Click: **🤖 Show Prediction**
3. Click: **📅 Next 30 Days**
4. Wait: **⏳ Processing...** (2-3 seconds)

### Step 4: Verify Results
Check prediction displays:
- ✅ **Predicted Emission:** 1,250.50 tCO₂e
- ✅ **Confidence Level:** 85%
- ✅ **Industry:** Manufacturing/Cement/Steel/etc.
- ✅ **Model Source:** XGBoost ML
- ✅ **Scope Breakdown:** Bar charts for Scope 1 & 2
- ✅ **Recommendations:** 3-5 bullet points
- ✅ **Industry Insights:** 4 metrics grid

---

## 🏭 Test Different Industries

### Cement Industry
```javascript
// Dashboard shows:
- Main Source: Clinker production
- Scope 1: 62%
- Recommendations: Alternative fuels, blended cements
```

### Steel Industry
```javascript
// Dashboard shows:
- Main Source: Blast furnace operations
- Scope 1: 70%
- Recommendations: Scrap-based EAF, hydrogen DRI
```

### Power Industry
```javascript
// Dashboard shows:
- Main Source: Coal combustion
- Scope 1: 98%
- Recommendations: Renewables, grid efficiency
```

---

## 🔧 Troubleshooting

### ML Server Not Starting?
```bash
cd ml\predict_org_emissions
pip install -r requirements.txt
python api.py
```

### Port Already in Use?
```bash
# Find process using port 8001
netstat -ano | findstr :8001

# Kill it (replace <PID>)
taskkill /PID <PID> /F
```

### No Prediction Showing?
1. Check console (F12) for errors
2. Verify ML server running: `curl http://localhost:8001/health`
3. Check backend logs
4. Try regenerating prediction

### Fallback Mode Warning?
- This is **normal** when ML server is down
- System uses fallback calculation
- Still generates predictions
- Just lower confidence

---

## 📊 Expected Output

### ML API Console (Port 8001)
```
============================================================
🏭 Organization Emission Prediction API
============================================================
📍 Running on: http://localhost:8001
🎯 Focus: Manufacturing Industries
🤖 Model Status: ✓ Loaded
============================================================
```

### Backend Console (Port 5000)
```
🚀 Server running on port 5000
MongoDB Atlas connected
```

### Frontend Browser (Port 3000)
```
React App running
Organization Dashboard loaded
AI Forecasting widget visible
```

---

## ✅ Success Checklist

- [ ] All 4 terminals open and running
- [ ] ML server shows "Model Status: ✓ Loaded"
- [ ] Backend shows "MongoDB Atlas connected"
- [ ] Frontend opens in browser
- [ ] Can login as organization user
- [ ] Dashboard loads successfully
- [ ] "Show Prediction" button works
- [ ] Prediction generates in 2-3 seconds
- [ ] All UI elements display (emission, confidence, breakdown, recommendations)
- [ ] No console errors

---

## 🎯 Demo for Judges (30 sec)

1. **Show Dashboard:** "Here's our organization dashboard"
2. **Click Predict:** "Let's generate a 30-day forecast"
3. **Highlight Results:**
   - "85% confidence from XGBoost model"
   - "Scope breakdown shows 62% from clinker production"
   - "AI recommends 5 reduction strategies"
4. **Show Robustness:** "Even if ML server goes down, fallback calculation works"

---

## 📱 Quick Commands Reference

| Task | Command |
|------|---------|
| Start all | `START_ALL.bat` |
| Start ML only | `cd ml\predict_org_emissions && START_ORG_ML_API.bat` |
| Start backend | `cd backend && npm start` |
| Start frontend | `cd frontend && npm start` |
| Test ML health | `curl http://localhost:8001/health` |
| Test ML industries | `curl http://localhost:8001/industries` |
| Check ports | `netstat -ano \| findstr "8001"` |
| View logs | Check terminal windows |

---

## 🚀 Next Actions

1. **Start System:** Run `START_ALL.bat`
2. **Wait 30 seconds:** For all services to initialize
3. **Open Browser:** Go to `http://localhost:3000`
4. **Login:** Use organization credentials
5. **Test Prediction:** Follow "🧪 Test AI Prediction" above
6. **Demo Ready:** System is operational! 🎉

---

**Time to Production:** ~30 seconds  
**Time to First Prediction:** ~3 minutes  
**Status:** ✅ Ready to Demo

---

Need detailed testing? See: **TESTING_GUIDE.md**  
Need architecture details? See: **IMPLEMENTATION_SUMMARY.md**
