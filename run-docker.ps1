# Запуск проекта в Docker
# Требуется: Docker Desktop

Set-Location $PSScriptRoot

Write-Host "Запуск Spotify Clone в Docker..." -ForegroundColor Green
docker-compose up -d --build

Write-Host ""
Write-Host "Готово!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000"
Write-Host "  Backend:  http://localhost:8000"
Write-Host "  API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "Seed (тестовые данные):" -ForegroundColor Yellow
Write-Host '  Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed" -Method POST'
Write-Host ""
Write-Host "Остановка: docker-compose down" -ForegroundColor Gray
