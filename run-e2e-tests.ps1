# E2E Test Runner - PowerShell Helper
# Uruchamia testy E2E krok po kroku

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  JANUS AI - E2E Tests Runner" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Krok 1: Sprawdź Supabase
Write-Host "[1/5] Sprawdzam Supabase..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://127.0.0.1:54321/rest/v1/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  ✓ Supabase działa" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Supabase NIE działa" -ForegroundColor Red
    Write-Host "  Uruchom: cd backend && npx supabase start" -ForegroundColor Yellow
    exit 1
}

# Krok 2: Sprawdź backend .env
Write-Host "[2/5] Sprawdzam konfigurację backend..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "  ✓ Backend .env istnieje" -ForegroundColor Green
} else {
    Write-Host "  ✗ Brak backend\.env" -ForegroundColor Red
    Write-Host "  Uruchom: Copy-Item backend\.env.example backend\.env" -ForegroundColor Yellow
    exit 1
}

# Krok 3: Uruchom backend
Write-Host "[3/5] Uruchamiam backend..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "d:\Janus AI\backend"
    npm run dev
}
Write-Host "  ⏳ Czekam 10s na start backendu..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Sprawdź czy backend odpowiada
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Backend działa na http://localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend nie odpowiada" -ForegroundColor Red
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

# Krok 4: Uruchom frontend
Write-Host "[4/5] Uruchamiam frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "d:\Janus AI\frontend"
    npm run dev
}
Write-Host "  ⏳ Czekam 10s na start frontendu..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Sprawdź czy frontend odpowiada
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Frontend działa na http://localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Frontend nie odpowiada" -ForegroundColor Red
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    exit 1
}

# Krok 5: Uruchom testy
Write-Host "[5/5] Uruchamiam testy E2E..." -ForegroundColor Yellow
Write-Host ""
npm run test:e2e

# Cleanup
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Zatrzymuję serwery..." -ForegroundColor Yellow
Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
Write-Host "Gotowe!" -ForegroundColor Green
