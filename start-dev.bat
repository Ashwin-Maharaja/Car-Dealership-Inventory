@echo off
echo ========================================================
echo  🚗 AutoDealer Pro - Car Dealership Inventory System
echo ========================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please download and install Node.js (LTS version) from:
    echo   https://nodejs.org/
    echo After installing, restart your terminal and run this script again.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend && call npm install && cd ..
)
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)

echo.
echo [2/3] Seeding database...
cd backend && call npm run seed && cd ..

echo.
echo [3/3] Starting Backend API (port 3001) and Frontend (port 5173)...
echo.
start "AutoDealer Backend API" cmd /k "cd backend && npm run dev"
timeout /t 2 >nul
start "AutoDealer Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo System started!
echo - Backend API:  http://localhost:3001
echo - Frontend UI:  http://localhost:5173
echo.
pause
