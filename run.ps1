# Запуск FastAPI сервера
Set-Location $PSScriptRoot
python -m uvicorn app.main:app --reload
