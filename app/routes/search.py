"""Search routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.track import Track
from app.models.album import Album
from app.schemas import TrackResponse, AlbumResponse, ArtistSearchResult

router = APIRouter()


@router.get("/")
def search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """Поиск по трекам, альбомам и артистам."""
    query = q.strip().lower()
    if not query:
        return {"tracks": [], "albums": [], "artists": []}

    # Поиск треков (title, artist)
    tracks = (
        db.query(Track)
        .filter(
            or_(
                Track.title.ilike(f"%{query}%"),
                Track.artist.ilike(f"%{query}%"),
            )
        )
        .limit(20)
        .all()
    )

    # Поиск альбомов (title, artist)
    albums = (
        db.query(Album)
        .filter(
            or_(
                Album.title.ilike(f"%{query}%"),
                Album.artist.ilike(f"%{query}%"),
            )
        )
        .limit(20)
        .all()
    )

    # Артисты — уникальные имена из треков и альбомов
    artist_names = set()
    for t in tracks:
        if query in t.artist.lower():
            artist_names.add(t.artist)
    for a in albums:
        if query in a.artist.lower():
            artist_names.add(a.artist)
    artists = [ArtistSearchResult(name=name) for name in sorted(artist_names)[:20]]

    return {
        "tracks": [TrackResponse.model_validate(t) for t in tracks],
        "albums": [AlbumResponse.model_validate(a) for a in albums],
        "artists": artists,
    }
