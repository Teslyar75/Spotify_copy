"""Скрипт инициализации БД: создание базы и применение миграций."""

import os
import sys

# Добавляем корень проекта в path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

# Проверка подключения
database_url = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/spotify_clone"
)
print(f"Подключение к: {database_url.split('@')[-1]}")

# Применяем миграции
import subprocess

result = subprocess.run(
    [sys.executable, "-m", "alembic", "upgrade", "head"],
    cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
)
sys.exit(result.returncode)
