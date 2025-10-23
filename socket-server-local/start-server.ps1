# PlayNowEmulator - Local Socket.IO Server Starter
# This script sets up and starts the Flask Socket.IO server for local development

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PlayNowEmulator - Local Socket.IO Server                 ║" -ForegroundColor Cyan
Write-Host "║   Flask-based Multiplayer Development Server              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "📁 Server directory: $scriptPath" -ForegroundColor Yellow

# Check if virtual environment exists
$venvPath = Join-Path $scriptPath "venv"
$venvActivate = Join-Path $venvPath "Scripts\Activate.ps1"

if (-not (Test-Path $venvActivate)) {
    Write-Host ""
    Write-Host "⚠️  Virtual environment not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    
    python -m venv venv
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow

try {
    & $venvActivate
    Write-Host "✅ Virtual environment activated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
    Write-Host "Try running: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    exit 1
}

# Check if requirements are installed
$requirementsPath = Join-Path $scriptPath "requirements.txt"
if (Test-Path $requirementsPath) {
    Write-Host ""
    Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
    
    # Try to import flask_socketio to check if installed
    python -c "import flask_socketio" 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "📥 Installing dependencies from requirements.txt..." -ForegroundColor Yellow
        pip install -r $requirementsPath
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✅ Dependencies already installed" -ForegroundColor Green
    }
}

# Check if app.py exists
$appPath = Join-Path $scriptPath "app.py"
if (-not (Test-Path $appPath)) {
    Write-Host "❌ app.py not found at $appPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎮 Starting Socket.IO server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Run the Flask app
python $appPath

# If we get here, the server was stopped
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "👋 Server stopped" -ForegroundColor Yellow
Write-Host ""
Write-Host "Deactivating virtual environment..." -ForegroundColor Yellow
deactivate

Write-Host "✅ Done" -ForegroundColor Green