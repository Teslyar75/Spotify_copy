"""
Jamendo API integration.

Позволяет искать треки на Jamendo и импортировать их в базу данных проекта.
Треки воспроизводятся по прямой ссылке с серверов Jamendo — никакие файлы
локально не скачиваются.

GET  /api/jamendo/search  — поиск треков на Jamendo
POST /api/jamendo/import  — сохранить трек из Jamendo в локальную БД
"""

from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import JAMENDO_CLIENT_ID
from app.database import get_db
from app.dependencies import get_admin_user_id
from app.models.track import Track

router = APIRouter()

JAMENDO_API_BASE = "https://api.jamendo.com/v3.0"


# ──────────────────────────────────────────────
# Схемы ответа
# ──────────────────────────────────────────────

class JamendoTrack(BaseModel):
    """Трек из Jamendo API, возвращаемый клиенту."""
    jamendo_id: str
    title: str
    artist: str
    album_name: str
    duration: int
    audio_url: str          # прямая ссылка для стриминга (mp3 96kbps)
    image_url: str
    license_url: str


class JamendoImportRequest(BaseModel):
    """Тело запроса для импорта трека в локальную БД."""
    jamendo_id: str
    title: str
    artist: str
    duration: int
    audio_url: str
    image_url: str
    album_id: UUID | None = None


# ──────────────────────────────────────────────
# Эндпоинты
# ──────────────────────────────────────────────

@router.get("/search", response_model=list[JamendoTrack])
def search_jamendo(
    q: str = Query("", description="Поисковый запрос (название, артист, тег)"),
    tags: str = Query("", description="Теги жанров через пробел: rock pop electronic"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """
    Поиск треков на Jamendo.

    Параметры:
    - q: свободный текстовый поиск (название трека, артист, альбом)
    - tags: теги жанров через пробел (rock, pop, electronic, jazz, classical и т.д.)
    - limit: количество результатов (1–50)
    - offset: смещение для пагинации

    Возвращает треки с прямыми ссылками для стриминга.
    """
    if not q and not tags:
        q = "popular"

    params = {
        "client_id": JAMENDO_CLIENT_ID,
        "format": "json",
        "limit": limit,
        "offset": offset,
        "audioformat": "mp31",   # 96kbps mp3 — лёгкий стриминг
        "imagesize": 300,
        "order": "popularity_month",
        "type": "albumtrack single",
    }

    if q:
        params["search"] = q
    if tags:
        params["fuzzytags"] = tags.strip()

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{JAMENDO_API_BASE}/tracks/", params=params)
            resp.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Jamendo API не ответил вовремя",
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ошибка запроса к Jamendo: {e}",
        )

    data = resp.json()
    results = data.get("results", [])

    tracks = []
    for t in results:
        audio_url = t.get("audio", "")
        if not audio_url:
            continue
        tracks.append(JamendoTrack(
            jamendo_id=str(t.get("id", "")),
            title=t.get("name", "Unknown"),
            artist=t.get("artist_name", "Unknown"),
            album_name=t.get("album_name", ""),
            duration=int(t.get("duration", 0)),
            audio_url=audio_url,
            image_url=t.get("album_image", t.get("image", "")),
            license_url=t.get("license_ccurl", ""),
        ))

    return tracks


@router.post("/import", status_code=status.HTTP_201_CREATED)
def import_jamendo_track(
    body: JamendoImportRequest,
    db: Session = Depends(get_db),
    _admin: UUID = Depends(get_admin_user_id),
):
    """
    Импортировать трек из Jamendo в локальную БД.

    Трек сохраняется с audio_url (прямая ссылка на Jamendo) в поле file_url.
    Файл НЕ скачивается — браузер стримит аудио напрямую с серверов Jamendo.

    Если трек с таким Jamendo ID уже импортирован — возвращается существующий.
    """
    # Jamendo ID сохраняем в виде тега в начале title, чтобы избежать дублей.
    # Ищем существующий трек по совпадению file_url (содержит Jamendo track id).
    existing = (
        db.query(Track)
        .filter(Track.file_url == body.audio_url)
        .first()
    )
    if existing:
        return {
            "id": str(existing.id),
            "title": existing.title,
            "message": "Трек уже существует в базе данных",
            "already_exists": True,
        }

    track = Track(
        title=body.title,
        artist=body.artist,
        duration=body.duration,
        file_url=body.audio_url,
        image_url=body.image_url or None,
        album_id=body.album_id,
    )
    db.add(track)
    db.commit()
    db.refresh(track)

    return {
        "id": str(track.id),
        "title": track.title,
        "artist": track.artist,
        "message": "Трек успешно импортирован",
        "already_exists": False,
    }
