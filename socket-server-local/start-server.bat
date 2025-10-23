@echo off
REM PlayNowEmulator - Local Socket.IO Server Starter (Batch version)
REM This script sets up and starts the Flask Socket.IO server for local development

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   PlayNowEmulator - Local Socket.IO Server                 ║
echo ║   Flask-based Multiplayer Development Server              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set "SCRIPT_DIR=%~dp0"
echo 📁 Server directory: %SCRIPT_DIR%

REM Check if virtual environment exists
if not exist "%SCRIPT_DIR%venv\Scripts\activate.bat" (
    echo.
    echo ⚠️  Virtual environment not found!
    echo.
    echo Creating virtual environment...
    
    python -m venv venv
    
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    
    echo ✅ Virtual environment created
)

echo.
echo 🔧 Activating virtual environment...

call "%SCRIPT_DIR%venv\Scripts\activate.bat"

if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    pause
    exit /b 1
)

echo ✅ Virtual environment activated

REM Check if requirements.txt exists
if exist "%SCRIPT_DIR%requirements.txt" (
    echo.
    echo 📦 Checking dependencies...
    
    pip show flask-socketio >nul 2>&1
    
    if errorlevel 1 (
        echo 📥 Installing dependencies from requirements.txt...
        
        pip install -r "%SCRIPT_DIR%requirements.txt"
        
        if errorlevel 1 (
            echo ❌ Failed to install dependencies
            pause
            exit /b 1
        )
        
        echo ✅ Dependencies installed
    ) else (
        echo ✅ Dependencies already installed
    )
)

REM Check if app.py exists
if not exist "%SCRIPT_DIR%app.py" (
    echo ❌ app.py not found at %SCRIPT_DIR%app.py
    pause
    exit /b 1
)

echo.
echo 🎮 Starting Socket.IO server...
echo.
echo ════════════════════════════════════════════════════════════
echo.

REM Run the Flask app
python "%SCRIPT_DIR%app.py"

echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 👋 Server stopped
echo.
echo Deactivating virtual environment...

call "%SCRIPT_DIR%venv\Scripts\deactivate.bat"

echo ✅ Done
pause