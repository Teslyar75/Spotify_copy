# Полный локальный запуск: Postgres (Docker), миграции, бэкенд и фронт в отдельных окнах.
# Из корня:  .\scripts\dev.ps1
# Не оставляет несколько uvicorn на одном порту — перед стартом порты очищаются.

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

& "$PSScriptRoot\clear-dev-ports.ps1" -Ports 8000, 3000, 3001

try {
    docker compose up -d postgres 2>$null | Out-Null
} catch { }

try {
    python -m alembic upgrade head
} catch {
    Write-Host "Alembic warning: $_" -ForegroundColor Yellow
}

$backendCmd = @"
Set-Location '$ProjectRoot'
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
"@

$frontendCmd = @"
Set-Location '$ProjectRoot\frontend'
npm run dev
"@

Write-Host "Opening backend window (port 8000)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $backendCmd
)

Start-Sleep -Milliseconds 500

Write-Host "Opening frontend window (Vite)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $frontendCmd
)

Write-Host "Done. API: http://127.0.0.1:8000  Frontend: http://localhost:3000 (or next free port)" -ForegroundColor Cyan
