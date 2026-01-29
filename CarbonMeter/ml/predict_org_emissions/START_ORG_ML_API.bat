@echo off
echo ========================================
echo Starting ML API for Organization Predictions
echo Port: 8001
echo ========================================

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Install requirements if needed
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing/Updating dependencies...
pip install -r requirements.txt --quiet

echo.
echo Starting Flask ML API on http://localhost:8001
echo Press Ctrl+C to stop the server
echo.

python api.py

pause
