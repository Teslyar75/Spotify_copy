"""Song routes."""

import random
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.track import Track
from app.models.album import Album
from app.schemas import TrackCreate, TrackResponse, TrackUpdate

router = APIRouter()


@router.get("/", response_model=list[TrackResponse])
def get_all_songs(db: Session = Depends(get_db)):
    """Получить все треки."""
    tracks = db.query(Track).all()
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
def create_song(song_data: TrackCreate, db: Session = Depends(get_db)):
    """Создать новый трек."""
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
def update_song(track_id: UUID, song_data: TrackUpdate, db: Session = Depends(get_db)):
    """Обновить трек."""
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
def delete_song(track_id: UUID, db: Session = Depends(get_db)):
    """Удалить трек."""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    db.delete(track)
    db.commit()
    return {"message": "Track deleted successfully"}
