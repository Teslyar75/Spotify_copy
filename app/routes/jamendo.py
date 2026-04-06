"""
Jamendo API integration.

Позволяет искать треки на Jamendo и импортировать их в базу данных проекта.
Треки воспроизводятся по прямой ссылке с серверов Jamendo — никакие файлы
локально не скачиваются.

GET  /api/jamendo/search  — поиск треков на Jamendo
POST /api/jamendo/import  — сохранить трек из Jamendo в локальную БД
"""

import re
import uuid as uuid_module
from pathlib import Path
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import JAMENDO_CLIENT_ID
from app.database import get_db
from app.dependencies import get_admin_user_id
from app.models.track import Track

IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "media" / "images"

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
    album_name: str = ""
    genre: str = ""
    duration: int
    audio_url: str
    image_url: str
    album_id: UUID | None = None


# ──────────────────────────────────────────────
# Эндпоинты
# ──────────────────────────────────────────────

def _extract_jamendo_id(url: str) -> str | None:
    """Извлечь стабильный trackid из Jamendo audio URL.

    URL вида: https://prod-1.storage.jamendo.com/?trackid=1593988&format=mp31&from=...
    Токены (from=...) меняются при каждом запросе, но trackid — стабильный.
    """
    m = re.search(r"trackid=(\d+)", url or "")
    return m.group(1) if m else None


def _get_imported_jamendo_ids(db: Session) -> set[str]:
    """Вернуть set Jamendo trackid всех уже импортированных треков из БД."""
    rows = (
        db.query(Track.file_url)
        .filter(
            or_(
                Track.file_url.like("%jamendo%"),
                Track.file_url.like("%trackid=%"),
            )
        )
        .all()
    )
    return {_extract_jamendo_id(row[0]) for row in rows} - {None}


def _collect_unimported_tracks(
    base_params: dict,
    extra: dict,
    imported_ids: set[str],
    need: int,
    start_offset: int = 0,
) -> list[JamendoTrack]:
    """
    Запрашивать страницы Jamendo, пока не наберётся need треков, ещё не в библиотеке.

    Без этого после десятков импортов «топ по популярности» целиком совпадает с уже
    импортированным — первая страница API даёт 0 строк после фильтра.
    """
    # Jamendo: до 100 треков на запрос (см. документацию v3.0 /tracks)
    page_size = min(max(need * 2, 25), 100)
    collected: list[JamendoTrack] = []
    seen_ids: set[str] = set()
    off = start_offset
    max_pages = 25
    max_offset = start_offset + 3000

    for _ in range(max_pages):
        params = {**base_params, **extra, "limit": page_size, "offset": off}
        batch = _fetch_jamendo_tracks(params)
        if not batch:
            break
        for t in batch:
            if t.jamendo_id in seen_ids:
                continue
            seen_ids.add(t.jamendo_id)
            if t.jamendo_id not in imported_ids:
                collected.append(t)
            if len(collected) >= need:
                return collected[:need]
        off += page_size
        if off > max_offset:
            break
    return collected[:need]


def _fetch_jamendo_tracks(params: dict) -> list[JamendoTrack]:
    """Вспомогательная функция: делает запрос к Jamendo API и парсит результаты."""
    try:
        with httpx.Client(timeout=20.0) as client:
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

    payload = resp.json()
    hdr = payload.get("headers") or {}
    warnings = (hdr.get("warnings") or "").strip()
    if warnings:
        wlow = warnings.lower()
        if "usage limits" in wlow or "block your access" in wlow:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"Jamendo API: {warnings} "
                    "Укажите свой JAMENDO_CLIENT_ID в .env (https://devportal.jamendo.com)."
                ),
            )

    results = payload.get("results") or []
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


@router.get("/search", response_model=list[JamendoTrack])
def search_jamendo(
    q: str = Query("", description="Поисковый запрос (название трека или имя артиста)"),
    tags: str = Query("", description="Теги жанров через пробел: rock pop electronic"),
    limit: int = Query(40, ge=1, le=100),
    offset: int = Query(0, ge=0, le=5000),
    db: Session = Depends(get_db),
):
    """
    Поиск треков на Jamendo.

    Автоматически исключает треки, которые уже импортированы в библиотеку.
    Сравнение идёт по trackid (стабильная часть URL), а не по всему URL
    (токены в from=... меняются при каждом запросе).

    Стратегия поиска:
    1. По имени артиста (artist_name) — точный поиск
    2. Фолбэк: свободный текст (название трека, альбом, теги)
    """
    base_params = {
        "client_id": JAMENDO_CLIENT_ID,
        "format": "json",
        "audioformat": "mp31",
        "imagesize": 300,
        "order": "popularity_month",
        "type": "albumtrack single",
    }

    if tags:
        base_params["fuzzytags"] = tags.strip()

    imported_ids = _get_imported_jamendo_ids(db)

    if q:
        tracks = _collect_unimported_tracks(
            base_params, {"artist_name": q.strip()}, imported_ids, limit, offset
        )
        if not tracks:
            tracks = _collect_unimported_tracks(
                base_params, {"search": q.strip()}, imported_ids, limit, offset
            )
        return tracks

    return _collect_unimported_tracks(base_params, {}, imported_ids, limit, offset)


def _download_image(url: str) -> str | None:
    """Скачать обложку по URL и сохранить в media/images/. Вернуть локальный URL."""
    if not url:
        return None
    try:
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; SpotifyClone/1.0; +https://jamendo.com)",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url, follow_redirects=True, headers=headers)
            resp.raise_for_status()
        content_type = resp.headers.get("content-type", "image/jpeg").lower()
        ext = ".png" if "png" in content_type else ".webp" if "webp" in content_type else ".jpg"
        filename = f"{uuid_module.uuid4().hex}{ext}"
        (IMAGES_DIR / filename).write_bytes(resp.content)
        return f"/media/images/{filename}"
    except Exception:
        return None


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
    # Проверка дубля по trackid (стабильная часть URL, токены меняются).
    jamendo_id = _extract_jamendo_id(body.audio_url)
    if jamendo_id:
        existing = (
            db.query(Track)
            .filter(Track.file_url.like(f"%trackid={jamendo_id}%"))
            .first()
        )
    else:
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

    local_image_url = _download_image(body.image_url) if body.image_url else None

    track = Track(
        title=body.title,
        artist=body.artist,
        album_name=body.album_name or body.title,
        genre=body.genre.strip() or None,
        duration=body.duration,
        file_url=body.audio_url,
        image_url=local_image_url or body.image_url or None,
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
