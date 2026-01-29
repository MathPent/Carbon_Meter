@echo off
echo ========================================
echo   CarbonMeter - Complete System Startup
echo ========================================
echo.
echo Starting all services...
echo.

REM Start Python ML API
echo [1/3] Starting Python ML API on port 8000...
start "Python ML API" cmd /k "cd ml\Carbon_meter && python api.py"
timeout /t 3 /nobreak >nul

REM Start Node.js Backend
echo [2/3] Starting Node.js Backend on port 5000...
start "Node Backend" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak >nul

REM Start React Frontend
echo [3/3] Starting React Frontend on port 3000...
start "React Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo Services:
echo   - Python ML API:  http://localhost:8000
echo   - Node Backend:   http://localhost:5000
echo   - React Frontend: http://localhost:3000
echo.
echo Three terminal windows have opened.
echo Close this window when done.
echo ========================================
pause
