"""Album routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.album import Album
from app.models.track import Track
from app.schemas import AlbumCreate, AlbumResponse, AlbumUpdate

router = APIRouter()


@router.get("/", response_model=list[AlbumResponse])
def get_all_albums(db: Session = Depends(get_db)):
    """Получить все альбомы."""
    albums = db.query(Album).all()
    return albums


@router.get("/{album_id}", response_model=AlbumResponse)
def get_album(album_id: UUID, db: Session = Depends(get_db)):
    """Получить альбом по ID с треками."""
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    return album


@router.post("/", response_model=AlbumResponse)
def create_album(album_data: AlbumCreate, db: Session = Depends(get_db)):
    """Создать новый альбом."""
    album = Album(**album_data.model_dump())
    db.add(album)
    db.commit()
    db.refresh(album)
    return album


@router.put("/{album_id}", response_model=AlbumResponse)
def update_album(album_id: UUID, album_data: AlbumUpdate, db: Session = Depends(get_db)):
    """Обновить альбом."""
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    
    update_data = album_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(album, field, value)
    
    db.commit()
    db.refresh(album)
    return album


@router.delete("/{album_id}")
def delete_album(album_id: UUID, db: Session = Depends(get_db)):
    """Удалить альбом."""
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    
    db.delete(album)
    db.commit()
    return {"message": "Album deleted successfully"}
