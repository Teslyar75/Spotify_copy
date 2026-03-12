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

DEFAULT_LIMIT = 50
MAX_LIMIT = 100


@router.get("/health")
def track_health():
    """Health check для Track Service."""
    return {"status": "ok", "service": "track"}


@router.get("/", response_model=list[TrackResponse])
def get_all_songs(
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Получить треки с пагинацией (доступно всем)."""
    start = offset
    stop = offset + min(limit, MAX_LIMIT)
    tracks = (
        db.query(Track)
        .order_by(Track.created_at.desc())
        .slice(start, stop)  # безопасно для PostgreSQL \ падало в f405
        .all()
    )
    return tracks 


@router.get("/featured", response_model=list[TrackResponse])
def get_featured_songs(db: Session = Depends(get_db)):
    """Получить избранные треки (случайные)."""
    tracks = db.query(Track).limit(10).all()
    return random.sample(tracks, min(len(tracks), 6)) if tracks else []


@router.get("/made-for-you", response_model=list[TrackResponse])
def get_made_for_you_songs(db: Session = Depends(get_db)):
    """Получить треки 'Создано для вас' (случайные)."""
    tracks = db.query(Track).limit(10).all()
    return random.sample(tracks, min(len(tracks), 5)) if tracks else []


@router.get("/trending", response_model=list[TrackResponse])
def get_trending_songs(db: Session = Depends(get_db)):
    """Получить трендовые треки (случайные)."""
    tracks = db.query(Track).limit(10).all()
    return random.sample(tracks, min(len(tracks), 5)) if tracks else []


@router.get("/{track_id}", response_model=TrackResponse)
def get_song(track_id: UUID, db: Session = Depends(get_db)):
    """Получить трек по ID."""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    return track


@router.post("/", response_model=TrackResponse)
def create_song(
    song_data: TrackCreate,
    _: UUID = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
):
    """Создать новый трек (только админ)."""
    # Validate album if provided
    if song_data.album_id:
        album = db.query(Album).filter(Album.id == song_data.album_id).first()
        if not album:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Album not found"
            )
    
    track = Track(**song_data.model_dump())
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
    """Обновить трек (только админ)."""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    update_data = song_data.model_dump(exclude_unset=True)
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
    """Удалить трек (только админ)."""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    db.delete(track)
    db.commit()
    return {"message": "Track deleted successfully"}
