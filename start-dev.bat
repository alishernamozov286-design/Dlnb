@echo off
echo ========================================
echo   Mator Life - Development Server
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)

if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ========================================
echo   Starting Development Servers...
echo ========================================
echo.
echo Backend:  http://localhost:4000/api
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop servers
echo ========================================
echo.

REM Start both servers
call npm run dev
