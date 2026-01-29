@echo off
echo ========================================
echo   Starting React Frontend
echo ========================================
echo.
echo Port: 3000
echo URL: http://localhost:3000
echo.

cd frontend

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

REM Start the frontend
npm start

pause
