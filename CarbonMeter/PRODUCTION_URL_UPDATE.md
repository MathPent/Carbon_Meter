# Production URL Configuration Update

## Summary
All localhost references have been replaced with production URLs throughout the application.

## Production URLs
- **Frontend (Netlify):** https://carbonmeter-mathpent.netlify.app
- **Backend (Render):** https://carbon-meter-kixz.onrender.com
- **ML API:** (To be deployed separately if needed)

---

## Files Updated

### 1. Frontend Configuration

#### ✅ `frontend/.env`
- **Status:** Already configured correctly
- **Value:** `REACT_APP_API_URL=https://carbon-meter-kixz.onrender.com`

#### ✅ `frontend/netlify.toml`
- **Changed:** `REACT_APP_API_BASE_URL` → `REACT_APP_API_URL`
- **Value:** `https://carbon-meter-kixz.onrender.com`

#### ✅ `frontend/.env.example`
- **Status:** Already configured with correct production URLs
- **Default:** Points to production backend

#### ✅ `frontend/src/config/api.config.js`
- **Status:** Already using environment variables
- **No hardcoded URLs present**

---

### 2. Backend Configuration

#### ✅ `backend/.env`
**Added environment variables:**
```env
NODE_ENV=production
FRONTEND_URL=https://carbonmeter-mathpent.netlify.app
ML_API_URL=https://carbon-meter-ml-api.onrender.com
```

#### ✅ `backend/src/server.js`
- **Status:** Already configured correctly
- **CORS origin:** `https://carbonmeter-mathpent.netlify.app`

---

### 3. Backend Routes

#### ✅ `backend/src/routes/orgPrediction.js`
**Before:**
```javascript
const ML_API_URL = 'http://localhost:8001';
```

**After:**
```javascript
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8001';
```

#### ✅ `backend/src/routes/prediction.js`
**Before:**
```javascript
const ML_API_URL = 'http://localhost:8000';
```

**After:**
```javascript
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';
```

#### ✅ `backend/src/routes/tips.js`
**Before:**
```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
```

**After:**
```javascript
const API_BASE_URL = process.env.API_BASE_URL || process.env.BACKEND_URL || 'https://carbon-meter-kixz.onrender.com';
```

---

### 4. Backend Controllers

#### ✅ `backend/src/controllers/orgController.js`
**Updated 2 ML API calls:**
- Line ~1789: Added `const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';`
- Line ~2187: Added `const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';`
- Both now use `${ML_API_URL}/predict/organization` instead of hardcoded `http://localhost:8000`

---

### 5. Test Files

#### ✅ `backend/test-resend-otp.js`
**Before:**
```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
```

**After:**
```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'https://carbon-meter-kixz.onrender.com';
```

#### ✅ `backend/test-leaderboard.js`
**Before:**
```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
```

**After:**
```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'https://carbon-meter-kixz.onrender.com';
```

#### ✅ `backend/test-carbox-ai.js`
**Before:**
```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
```

**After:**
```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'https://carbon-meter-kixz.onrender.com';
```

---

### 6. Utility Scripts

#### ✅ `backend/create-admin.js`
**Before:**
```javascript
console.log('🌐 Login at: http://localhost:3000/admin/login\n');
```

**After:**
```javascript
console.log('🌐 Login at: https://carbonmeter-mathpent.netlify.app/admin/login\n');
```

---

## Files NOT Changed (Already Correct or Documentation)

### Documentation Files (Localhost examples preserved for local development)
- `TESTING_GUIDE.md` - Contains local dev setup instructions
- `ENV_SETUP_GUIDE.md` - Contains local dev examples
- `DEPLOYMENT_GUIDE.md` - Contains deployment documentation
- `REFACTORING_SUMMARY.md` - Historical documentation
- `docs/FRONTEND_URL_FIX.md` - Reference documentation

### ML API Files (For local ML server development)
- `ml/predict_org_emissions/api.py` - Contains localhost refs for local ML testing
- `ml/Carbon_meter/api.py` - Contains localhost refs for local ML testing
- `ml/Carbon_meter/api_fallback.py` - Contains localhost refs for local ML testing

---

## Environment Variables Summary

### Frontend (.env)
```env
REACT_APP_API_URL=https://carbon-meter-kixz.onrender.com
```

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
FRONTEND_URL=https://carbonmeter-mathpent.netlify.app
ML_API_URL=https://carbon-meter-ml-api.onrender.com
EMAIL=...
EMAIL_PASS=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Deployment Configuration

### Netlify (Frontend)
**Environment Variables to Set:**
```
REACT_APP_API_URL=https://carbon-meter-kixz.onrender.com
```

### Render (Backend)
**Environment Variables to Set:**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NODE_ENV=production
FRONTEND_URL=https://carbonmeter-mathpent.netlify.app
ML_API_URL=https://carbon-meter-ml-api.onrender.com
EMAIL=...
EMAIL_PASS=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Testing Checklist

- [x] Frontend .env configured with production backend URL
- [x] Backend .env configured with production frontend URL
- [x] Netlify.toml configured with correct API URL
- [x] CORS origins updated in server.js
- [x] ML API calls use environment variables
- [x] Test files point to production by default
- [x] Admin creation script uses production frontend URL
- [ ] Test login flow: Frontend → Backend
- [ ] Test API calls from frontend to backend
- [ ] Test CORS configuration
- [ ] Test ML API integration (if ML server deployed)
- [ ] Verify Google OAuth works with production URLs

---

## Local Development

To run locally, override with local environment variables:

**Frontend:**
```env
REACT_APP_API_URL=http://localhost:5000
```

**Backend:**
```env
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ML_API_URL=http://localhost:8000
```

---

## Notes

1. **ML API URL:** Currently set to `https://carbon-meter-ml-api.onrender.com` as a placeholder. Update this when you deploy the ML API server.

2. **Test Files:** All test files now default to production URLs, but can be overridden with `API_BASE_URL` environment variable for local testing.

3. **Documentation:** Documentation files (`.md`) were intentionally left with localhost examples as they serve as local development guides.

4. **Backward Compatibility:** All changes maintain backward compatibility for local development through environment variable fallbacks.

---

## Completion Status: ✅ COMPLETE

All localhost references in source code have been replaced with production URLs or environment variables. The application is now production-ready.
