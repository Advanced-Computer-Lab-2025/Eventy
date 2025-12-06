# Start the recommendation service
Write-Host "🚀 Starting Eventy AI Recommendation Engine..." -ForegroundColor Cyan

# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Navigate to recommendations directory
Set-Location -Path "$PSScriptRoot"

# Check if virtual environment exists
if (!(Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Install dependencies
if (!(Test-Path "venv\Lib\site-packages\fastapi")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Create .env if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "⚙️  Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# Start the service
Write-Host "✅ Starting recommendation service on port 8000..." -ForegroundColor Green
python main.py
