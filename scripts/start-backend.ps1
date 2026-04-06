# Один бэкенд на порту 8000: сначала освобождаем порт, затем uvicorn.
# Запуск: из корня репозитория —  .\scripts\start-backend.ps1

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

& "$PSScriptRoot\clear-dev-ports.ps1" -Ports 8000

Write-Host "Starting uvicorn on http://127.0.0.1:8000 ..." -ForegroundColor Green
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
