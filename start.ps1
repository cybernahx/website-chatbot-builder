# AI Real Estate Chatbot Builder - Quick Start Script (Windows)
# Run this in PowerShell

Write-Host "AI Chatbot Builder - Quick Start" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/"
    exit 1
}

# Check if MongoDB is running
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if (-not $mongoProcess) {
    Write-Host "MongoDB is not running" -ForegroundColor Yellow
    Write-Host "Please start MongoDB with: mongod" -ForegroundColor Yellow
    Write-Host "Or install MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
} else {
    Write-Host "MongoDB is running" -ForegroundColor Green
}

# Navigate to backend
Set-Location backend

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host ".env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please edit .env and add your API keys:" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY (required)" -ForegroundColor White
    Write-Host "   - TWILIO_ACCOUNT_SID (optional)" -ForegroundColor White
    Write-Host "   - TWILIO_AUTH_TOKEN (optional)" -ForegroundColor White
    Write-Host "   - EMAIL_USER (optional)" -ForegroundColor White
    Write-Host "   - EMAIL_PASSWORD (optional)" -ForegroundColor White
    Write-Host ""
    
    # Open .env in default editor
    notepad .env
    
    Write-Host "Press Enter after saving .env to continue..." -ForegroundColor Yellow
    Read-Host
}

# Check if node_modules exists
if (-not (Test-Path node_modules)) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Dependencies already installed" -ForegroundColor Green
}


# Start the server
Write-Host ""
Write-Host "Starting server on http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Actions:" -ForegroundColor Yellow
Write-Host "   • API Health: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "   • Widget Demo: http://localhost:5000/widget/demo.html" -ForegroundColor White
Write-Host "   • API Docs: See SETUP.md" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm start
