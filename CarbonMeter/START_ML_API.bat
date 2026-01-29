@echo off
echo ========================================
echo   Starting Python ML API Server
echo ========================================
echo.
echo Port: 8000
echo Health Check: http://localhost:8000/health
echo.

cd ml\Carbon_meter

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if requirements are installed
if not exist carbonmeter_behavioral_model.pkl (
    echo WARNING: Model file not found!
    echo Path: carbonmeter_behavioral_model.pkl
    echo The API will run in fallback mode.
    echo.
)

REM Start the ML API
python api.py

pause
