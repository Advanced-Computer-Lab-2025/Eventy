# Eventy - Start All Services
Write-Host "🚀 Starting Eventy Platform..." -ForegroundColor Cyan
Write-Host ""

# Start MongoDB (assumes MongoDB is installed and mongod is in PATH)
Write-Host "1️⃣  Starting MongoDB..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "mongod" -ArgumentList "--dbpath", "C:\data\db"
Start-Sleep -Seconds 3

# Start AI Recommendation Service
Write-Host "2️⃣  Starting AI Recommendation Engine (Port 8000)..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd recommendations; python main.py"
Start-Sleep -Seconds 5

# Start Main Server (Node.js + Vite)
Write-Host "3️⃣  Starting Main Server (Port 5000)..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd server; tsx index.ts"

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Services:" -ForegroundColor Cyan
Write-Host "   - Main App: http://localhost:5000" -ForegroundColor White
Write-Host "   - API: http://localhost:5000/api" -ForegroundColor White
Write-Host "   - AI Recommendations: http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop services" -ForegroundColor Gray
