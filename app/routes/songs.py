"""Song routes — Track Service."""

import random
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_user_id
from app.models.track import Track
from app.models.album import Album
from app.schemas import TrackCreate, TrackResponse, TrackUpdate

router = APIRouter()

DEFAULT_LIMIT = 100
MAX_LIMIT = 500


@router.get("/health")
def track_health():
    """Health check для Track Service."""
    return {"status": "ok", "service": "track"}


@router.get("/", response_model=list[TrackResponse])
def get_all_songs(
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(0, ge=0),
    genre: str | None = Query(None, description="Фильтр по жанру (rock, pop, jazz...)"),
    db: Session = Depends(get_db),
):
    """
    Список треков с пагинацией и опциональной фильтрацией по жанру.

    genre — если задан, возвращаются только треки, у которых genre содержит
    эту строку (регистронезависимо). Используется для фильтра по категориям в поиске.
    """
    start = offset
    stop = offset + min(limit, MAX_LIMIT)
    q = db.query(Track).order_by(Track.created_at.desc())
    if genre and genre.strip():
        q = q.filter(Track.genre.ilike(f"%{genre.strip()}%"))
    tracks = q.slice(start, stop).all()
    return tracks


@router.get("/featured", response_model=list[TrackResponse])
def get_featured_songs(db: Session = Depends(get_db)):
    """
    Featured треки для главной страницы.

    Берём последние 100 добавленных треков и возвращаем 12 случайных.
    Это гарантирует, что недавно импортированные треки тоже попадают на главную.
    """
    tracks = db.query(Track).order_by(Track.created_at.desc()).limit(100).all()
    return random.sample(tracks, min(len(tracks), 12)) if tracks else []


@router.get("/made-for-you", response_model=list[TrackResponse])
def get_made_for_you_songs(db: Session = Depends(get_db)):
    """
    Персональные треки 'Создано для вас'.

    Случайная выборка из всей библиотеки (используем func.random() для честного рандома).
    """
    tracks = db.query(Track).order_by(Track.created_at.desc()).limit(100).all()
    return random.sample(tracks, min(len(tracks), 12)) if tracks else []


@router.get("/browse-by-genre")
def get_tracks_by_genre(
    limit_per_genre: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Треки, сгруппированные по жанрам для главной и поиска.

    Возвращает словарь { genre: [tracks] } — только жанры, в которых есть треки.
    Треки без жанра попадают в категорию "Other".
    """
    from collections import defaultdict

    GENRE_DISPLAY: dict[str, str] = {
        "rock": "Rock", "pop": "Pop", "jazz": "Jazz", "classical": "Classical",
        "electronic": "Electronic", "hiphop": "Hip-Hop", "rnb": "R&B",
        "ambient": "Ambient", "other": "Other",
    }

    tracks = (
        db.query(Track)
        .order_by(Track.created_at.desc())
        .limit(500)
        .all()
    )
    by_genre: dict[str, list] = defaultdict(list)
    for t in tracks:
        raw = (t.genre or "").strip().lower() or "other"
        genre_display = GENRE_DISPLAY.get(raw, raw.capitalize())
        if len(by_genre[genre_display]) < limit_per_genre:
            by_genre[genre_display].append(TrackResponse.model_validate(t))
    return dict(by_genre)


@router.get("/trending", response_model=list[TrackResponse])
def get_trending_songs(db: Session = Depends(get_db)):
    """
    Трендовые треки.

    MVP: последние добавленные треки, случайная выборка.
    В продакшн: сортировка по количеству прослушиваний за 7 дней.
    """
    tracks = db.query(Track).order_by(Track.created_at.desc()).limit(100).all()
    return random.sample(tracks, min(len(tracks), 12)) if tracks else []


@router.get("/{track_id}", response_model=TrackResponse)
def get_song(track_id: UUID, db: Session = Depends(get_db)):
    """Получить один трек по UUID."""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    return track


# Два декоратора на одну функцию — исправление бага с 307-редиректом.
# FastAPI по умолчанию редиректит /api/songs → /api/songs/ (добавляет слэш).
# В Docker этот редирект ломался: Nginx менял Location на внутренний IP контейнера.
# Решение: регистрируем оба пути — с пустой строкой и со слэшем.
@router.post("", response_model=TrackResponse)
@router.post("/", response_model=TrackResponse)
def create_song(
    song_data: TrackCreate,
    _: UUID = Depends(get_admin_user_id),  # _ означает "нужна зависимость, но результат не используется"
    db: Session = Depends(get_db),
):
    """
    Создать новый трек. Только для администраторов.

    Если передан album_id:
        - проверяем, что альбом существует
        - автоматически заполняем album_name (денормализация для поиска)
        - если у трека нет своей обложки — наследуем image_url от альбома
    """
    data = song_data.model_dump()
    album_name = ""

    if song_data.album_id:
        album = db.query(Album).filter(Album.id == song_data.album_id).first()
        if not album:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Album not found"
            )
        album_name = album.title

        # Наследуем обложку альбома, если трек создаётся без своей
        if not data.get("image_url"):
            data["image_url"] = album.image_url

    # album_name денормализован в треке — для поиска без JOIN
    data["album_name"] = album_name

    track = Track(**data)
    db.add(track)
    db.commit()
    db.refresh(track)
    return track


@router.put("/{track_id}", response_model=TrackResponse)
def update_song(
    track_id: UUID,
    song_data: TrackUpdate,
    _: UUID = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
):
    """
    Обновить трек. Только для администраторов.

    model_dump(exclude_unset=True) — обновляем только переданные поля.
    Это позволяет изменить один атрибут, не затрагивая остальные.

    При изменении album_id:
        - обновляем album_name (денормализованное поле)
        - если у трека нет обложки — наследуем от нового альбома
    """
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )

    # exclude_unset=True — в update_data попадут только поля, которые клиент явно передал
    update_data = song_data.model_dump(exclude_unset=True)

    if "album_id" in update_data and update_data["album_id"]:
        # Трек привязывается к альбому — синхронизируем album_name и image_url
        album = db.query(Album).filter(Album.id == update_data["album_id"]).first()
        if album:
            update_data["album_name"] = album.title
            if not update_data.get("image_url") and not track.image_url:
                update_data["image_url"] = album.image_url
    elif "album_id" in update_data and update_data["album_id"] is None:
        # album_id сбрасывается в None — трек становится синглом
        update_data["album_name"] = ""

    # Применяем изменения через setattr (динамически, без явного перечисления полей)
    for field, value in update_data.items():
        setattr(track, field, value)

    db.commit()
    db.refresh(track)
    return track


@router.delete("/{track_id}")
def delete_song(
    track_id: UUID,
    _: UUID = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
):
    """
    Удалить трек. Только для администраторов.

    Каскадные удаления (настроены в моделях):
        - playlist_tracks с этим треком удалятся автоматически
        - listening_history с этим треком удалится автоматически
    """
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )

    db.delete(track)
    db.commit()
    return {"message": "Track deleted successfully"}
