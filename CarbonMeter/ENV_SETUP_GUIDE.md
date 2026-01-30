# Environment Variables Setup Guide

This guide explains how to configure environment variables for both local development and production deployment.

## 📋 Quick Overview

The application uses environment variables to switch between local and production environments seamlessly.

### Key Variables:
- **Frontend**: `REACT_APP_API_URL` - Backend API base URL
- **Backend**: `FRONTEND_URL` - Frontend URL for CORS and redirects
- **ML Service**: `FRONTEND_URL` and `BACKEND_URL` - For CORS configuration

---

## 🏠 Local Development Setup

### Frontend (.env file in `/frontend` folder)

Create a `.env` file in the `frontend` directory:

```env
# Local Development
REACT_APP_API_URL=http://localhost:5000

# Google OAuth (optional - get from Google Cloud Console)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Backend (.env file in `/backend` folder)

Your backend `.env` file should include:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_admin_password_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# ML API URLs
ML_API_URL=http://localhost:8001
```

### ML Service (Python)

Set environment variables before running the ML API:

**Windows PowerShell:**
```powershell
$env:FRONTEND_URL = "http://localhost:3000"
$env:BACKEND_URL = "http://localhost:5000"
```

**Linux/Mac:**
```bash
export FRONTEND_URL=http://localhost:3000
export BACKEND_URL=http://localhost:5000
```

---

## 🚀 Production Deployment Setup

### Netlify (Frontend)

Add these environment variables in Netlify Dashboard → Site Settings → Environment Variables:

```env
REACT_APP_API_URL=https://carbon-meter-kixz.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=your_production_google_client_id
```

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `build`

### Render (Backend)

Add these environment variables in Render Dashboard → Environment:

```env
MONGODB_URI=your_mongodb_atlas_production_uri
JWT_SECRET=your_production_jwt_secret
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_production_password
FRONTEND_URL=https://carbonmeter-mathpent.netlify.app
ML_API_URL=your_ml_service_url_if_deployed
NODE_ENV=production
PORT=5000
```

### ML Service (Production)

If deploying the ML service separately, set:

```env
FRONTEND_URL=https://carbonmeter-mathpent.netlify.app
BACKEND_URL=https://carbon-meter-kixz.onrender.com
PORT=8001
```

---

## 🔧 How It Works

### Frontend API Calls

All frontend API calls use the centralized configuration:

```javascript
// config/api.config.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

This means:
- **Local Development**: Uses `http://localhost:5000` (or value from .env)
- **Production**: Uses `https://carbon-meter-kixz.onrender.com` (from Netlify env vars)

### Backend CORS Configuration

The backend allows requests from:

```javascript
// server.js
cors({
  origin: [
    'https://carbonmeter-mathpent.netlify.app',   // Production
    process.env.FRONTEND_URL || 'http://localhost:3000'  // Configurable
  ],
  credentials: true
})
```

### ML Service CORS

The ML API allows requests from multiple sources:

```python
# api.py
allowed_origins = [
    "http://localhost:3000",  # Local React dev
    "http://localhost:5000",  # Local backend
    "https://carbonmeter-mathpent.netlify.app",  # Production frontend
    "https://carbon-meter-kixz.onrender.com",  # Production backend
]
```

---

## ✅ Verification Checklist

### After Setting Up Environment Variables:

**Frontend:**
- [ ] No hard-coded `localhost:5000` URLs in browser console
- [ ] API calls show correct base URL in Network tab
- [ ] CORS errors are resolved

**Backend:**
- [ ] Database connection successful
- [ ] CORS allows frontend domain
- [ ] Google OAuth redirects work

**ML Service:**
- [ ] ML predictions work from frontend
- [ ] CORS allows both frontend and backend

---

## 🐛 Troubleshooting

### Issue: CORS Error

**Symptom:** Browser console shows CORS policy error

**Solution:**
1. Check backend `FRONTEND_URL` environment variable
2. Verify frontend URL matches exactly (no trailing slash)
3. Restart backend after changing environment variables

### Issue: API Calls to localhost in Production

**Symptom:** Production frontend tries to call `http://localhost:5000`

**Solution:**
1. Verify `REACT_APP_API_URL` is set in Netlify
2. Rebuild and redeploy frontend
3. Clear browser cache

### Issue: 404 on API Endpoints

**Symptom:** API calls return 404 Not Found

**Solution:**
1. Verify backend is deployed and running
2. Check backend URL in `REACT_APP_API_URL`
3. Ensure backend routes are properly defined

---

## 📚 Additional Resources

- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

---

## 🔐 Security Notes

1. **Never commit `.env` files** to version control
2. Use different credentials for development and production
3. Rotate secrets regularly
4. Use strong, unique passwords for admin accounts
5. Keep Google OAuth credentials secure

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify all environment variables are set correctly
3. Check application logs for specific error messages
4. Ensure all services are running and accessible
