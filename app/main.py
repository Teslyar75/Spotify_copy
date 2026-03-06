"""FastAPI приложение Spotify Clone."""

import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.routes import auth, songs, albums, users, websocket, playlists, seed, search

app = FastAPI(title="Spotify Clone API")

# CORS: в production ограничить origins
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS = [o.strip() for o in CORS_ORIGINS.split(",")] if CORS_ORIGINS else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(songs.router, prefix="/api/songs", tags=["Songs"])
app.include_router(albums.router, prefix="/api/albums", tags=["Albums"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(playlists.router, prefix="/api/playlists", tags=["Playlists"])
app.include_router(seed.router, prefix="/api/seed", tags=["Seed"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(websocket.router, tags=["WebSocket"])


@app.get("/")
def root():
    return {"message": "Spotify Clone API", "status": "ok"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    """Проверка подключения к БД."""
    try:
        db.execute(text("SELECT 1"))
        return {"database": "ok"}
    except Exception as e:
        return {"database": "error", "detail": str(e)}
