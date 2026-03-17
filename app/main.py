"""
FastAPI приложение Spotify Clone.

Точка входа: uvicorn app.main:app --reload

Структура:
    - CORS: разрешает запросы с frontend (localhost:3000 и др.)
    - Роутеры: auth, songs, albums, playlists, search, seed и т.д.
    - /health — проверка подключения к PostgreSQL
"""

import os
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from fastapi.staticfiles import StaticFiles

from app.routes import auth, songs, albums, users, websocket, playlists, seed, search, player, recommendations, upload, jamendo

# Создаём экземпляр FastAPI — это и есть всё приложение.
# title отображается в Swagger-документации на /docs
app = FastAPI(title="Spotify Clone API")

# ──────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing)
# ──────────────────────────────────────────────
# Браузер по умолчанию блокирует запросы с одного домена на другой.
# Например, фронтенд на localhost:3000 не может обращаться к backend на localhost:8000
# без явного разрешения. CORSMiddleware добавляет нужные заголовки ко всем ответам.
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002")
ALLOWED_ORIGINS = [o.strip() for o in CORS_ORIGINS.split(",")] if CORS_ORIGINS else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,   # с каких доменов разрешены запросы
    allow_credentials=True,           # разрешить куки и заголовок Authorization
    allow_methods=["*"],              # разрешить все HTTP-методы (GET, POST, PUT, DELETE…)
    allow_headers=["*"],              # разрешить любые заголовки
)

# ──────────────────────────────────────────────
# Подключение роутеров
# ──────────────────────────────────────────────
# Каждый роутер — это группа эндпоинтов одного домена.
# prefix задаёт общий URL-префикс для всех эндпоинтов роутера.
# tags — группировка в Swagger-документации.
app.include_router(auth.router,            prefix="/api/auth",            tags=["Auth"])
app.include_router(songs.router,           prefix="/api/songs",           tags=["Songs"])
app.include_router(albums.router,          prefix="/api/albums",          tags=["Albums"])
app.include_router(users.router,           prefix="/api/users",           tags=["Users"])
app.include_router(playlists.router,       prefix="/api/playlists",       tags=["Playlists"])
app.include_router(seed.router,            prefix="/api/seed",            tags=["Seed"])
app.include_router(search.router,          prefix="/api/search",          tags=["Search"])
app.include_router(player.router,          prefix="/api/player",          tags=["Player"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(upload.router,          prefix="/api/upload",          tags=["Upload"])
app.include_router(jamendo.router,         prefix="/api/jamendo",         tags=["Jamendo"])
# WebSocket роутер монтируется без префикса — путь /ws задан прямо в роутере
app.include_router(websocket.router,       tags=["WebSocket"])

# ──────────────────────────────────────────────
# Раздача медиафайлов
# ──────────────────────────────────────────────
# Загруженные изображения и аудио хранятся в папке /media.
# StaticFiles позволяет отдавать их напрямую по URL /media/images/... и /media/songs/...
# Папки создаются при старте, если их нет.
_media_dir = Path(__file__).resolve().parent.parent / "media"
_media_dir.mkdir(parents=True, exist_ok=True)
(_media_dir / "images").mkdir(exist_ok=True)
(_media_dir / "songs").mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=str(_media_dir)), name="media")


@app.get("/")
def root():
    """Корневой endpoint — базовая информация об API."""
    return {"message": "Spotify Clone API", "status": "ok"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    """
    Проверка работоспособности backend + подключения к PostgreSQL.
    Выполняет минимальный запрос SELECT 1 — если БД отвечает, всё ок.
    Docker Compose использует этот endpoint как healthcheck.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"database": "ok"}
    except Exception as e:
        return {"database": "error", "detail": str(e)}
