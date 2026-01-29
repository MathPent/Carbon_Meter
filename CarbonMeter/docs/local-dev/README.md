# Local Development Scripts

This folder contains Windows batch scripts for local development only.  
**These are NOT needed for deployment.**

## Available Scripts

### START_ALL.bat
Starts all services simultaneously:
- Backend (Node.js on port 5000)
- Frontend (React on port 3000)  
- ML API (Python on port 8001)

### START_BACKEND.bat
Starts only the Node.js backend server

### START_FRONTEND.bat
Starts only the React frontend

### START_ML_API.bat
Starts only the Python ML service

## Usage (Windows Only)

```cmd
# Start everything
START_ALL.bat

# Or start individually
START_BACKEND.bat
START_FRONTEND.bat
START_ML_API.bat
```

## For Other Operating Systems

### Linux / macOS

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**ML Service:**
```bash
cd ml/predict_org_emissions
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python api.py
```

## Production Deployment

For production deployment (Netlify/Render), these scripts are not used.  
See the main README.md for deployment instructions.
