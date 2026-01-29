@echo off
echo ========================================
echo   Starting Node.js Backend Server
echo ========================================
echo.
echo Port: 5000
echo Health Check: http://localhost:5000/api/health
echo.

cd backend

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

REM Start the backend
npm start

pause
