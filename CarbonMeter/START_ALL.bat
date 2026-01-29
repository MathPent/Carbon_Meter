@echo off
echo ========================================
echo   CarbonMeter - Complete System Startup
echo ========================================
echo.
echo Starting all services...
echo.

REM Start Individual Python ML API
echo [1/4] Starting Individual ML API on port 8000...
start "Individual ML API" cmd /k "cd ml\Carbon_meter && python api.py"
timeout /t 3 /nobreak >nul

REM Start Organization Python ML API
echo [2/4] Starting Organization ML API on port 8001...
start "Organization ML API" cmd /k "cd ml\predict_org_emissions && START_ORG_ML_API.bat"
timeout /t 3 /nobreak >nul

REM Start Node.js Backend
echo [3/4] Starting Node.js Backend on port 5000...
start "Node Backend" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak >nul

REM Start React Frontend
echo [4/4] Starting React Frontend on port 3000...
start "React Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo Services:
echo   - Individual ML API:     http://localhost:8000
echo   - Organization ML API:   http://localhost:8001
echo   - Node Backend:          http://localhost:5000
echo   - React Frontend:        http://localhost:3000
echo.
echo Four terminal windows have opened.
echo Close this window when done.
echo ========================================
pause
