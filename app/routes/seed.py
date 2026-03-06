"""Seed routes - endpoints для загрузки тестовых данных."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth_user import AuthUser
from app.models.user_profile import UserProfile
from app.models.album import Album
from app.models.track import Track
from app.models.playlist import Playlist
from app.models.playlist_track import PlaylistTrack
from app.utils import get_password_hash

router = APIRouter()

# Тестовые данные из Spotify-version
TEST_USER = {
    "email": "test@example.com",
    "password": "test123",
    "username": "testuser"
}

# Базовый URL для медиафайлов
MEDIA_BASE_URL = "/media"

# Альбомы из seeds/albums.js
TEST_ALBUMS = [
    {"title": "Urban Nights", "artist": "Various Artists", "image_url": f"{MEDIA_BASE_URL}/albums/1.jpg", "release_year": 2024},
    {"title": "Coastal Dreaming", "artist": "Various Artists", "image_url": f"{MEDIA_BASE_URL}/albums/2.jpg", "release_year": 2024},
    {"title": "Midnight Sessions", "artist": "Various Artists", "image_url": f"{MEDIA_BASE_URL}/albums/3.jpg", "release_year": 2024},
    {"title": "Eastern Dreams", "artist": "Various Artists", "image_url": f"{MEDIA_BASE_URL}/albums/4.jpg", "release_year": 2024}
]

# Треки из seeds/songs.js и seeds/albums.js
TEST_TRACKS = [
    # Album 1: Urban Nights
    {"title": "City Rain", "artist": "Urban Echo", "duration": 39, "file_url": f"{MEDIA_BASE_URL}/songs/7.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/7.jpg", "album_name": "Urban Nights"},
    {"title": "Neon Lights", "artist": "Night Runners", "duration": 36, "file_url": f"{MEDIA_BASE_URL}/songs/5.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/5.jpg", "album_name": "Urban Nights"},
    {"title": "Urban Jungle", "artist": "City Lights", "duration": 36, "file_url": f"{MEDIA_BASE_URL}/songs/15.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/15.jpg", "album_name": "Urban Nights"},
    {"title": "Neon Dreams", "artist": "Cyber Pulse", "duration": 39, "file_url": f"{MEDIA_BASE_URL}/songs/13.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/13.jpg", "album_name": "Urban Nights"},
    
    # Album 2: Coastal Dreaming
    {"title": "Summer Daze", "artist": "Coastal Kids", "duration": 24, "file_url": f"{MEDIA_BASE_URL}/songs/4.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/4.jpg", "album_name": "Coastal Dreaming"},
    {"title": "Ocean Waves", "artist": "Coastal Drift", "duration": 28, "file_url": f"{MEDIA_BASE_URL}/songs/9.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/9.jpg", "album_name": "Coastal Dreaming"},
    {"title": "Crystal Rain", "artist": "Echo Valley", "duration": 39, "file_url": f"{MEDIA_BASE_URL}/songs/16.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/16.jpg", "album_name": "Coastal Dreaming"},
    {"title": "Starlight", "artist": "Luna Bay", "duration": 30, "file_url": f"{MEDIA_BASE_URL}/songs/10.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/10.jpg", "album_name": "Coastal Dreaming"},
    
    # Album 3: Midnight Sessions
    {"title": "Stay With Me", "artist": "Sarah Mitchell", "duration": 46, "file_url": f"{MEDIA_BASE_URL}/songs/1.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/1.jpg", "album_name": "Midnight Sessions"},
    {"title": "Midnight Drive", "artist": "The Wanderers", "duration": 41, "file_url": f"{MEDIA_BASE_URL}/songs/2.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/2.jpg", "album_name": "Midnight Sessions"},
    {"title": "Moonlight Dance", "artist": "Silver Shadows", "duration": 27, "file_url": f"{MEDIA_BASE_URL}/songs/14.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/14.jpg", "album_name": "Midnight Sessions"},
    
    # Album 4: Eastern Dreams
    {"title": "Lost in Tokyo", "artist": "Electric Dreams", "duration": 24, "file_url": f"{MEDIA_BASE_URL}/songs/3.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/3.jpg", "album_name": "Eastern Dreams"},
    {"title": "Neon Tokyo", "artist": "Future Pulse", "duration": 39, "file_url": f"{MEDIA_BASE_URL}/songs/17.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/17.jpg", "album_name": "Eastern Dreams"},
    {"title": "Purple Sunset", "artist": "Dream Valley", "duration": 17, "file_url": f"{MEDIA_BASE_URL}/songs/12.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/12.jpg", "album_name": "Eastern Dreams"},
    
    # Extra tracks (without album)
    {"title": "Mountain High", "artist": "The Wild Ones", "duration": 40, "file_url": f"{MEDIA_BASE_URL}/songs/6.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/6.jpg", "album_name": ""},
    {"title": "Desert Wind", "artist": "Sahara Sons", "duration": 28, "file_url": f"{MEDIA_BASE_URL}/songs/8.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/8.jpg", "album_name": ""},
    {"title": "Winter Dreams", "artist": "Arctic Pulse", "duration": 29, "file_url": f"{MEDIA_BASE_URL}/songs/11.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/11.jpg", "album_name": ""},
    {"title": "Midnight Blues", "artist": "Jazz Cats", "duration": 29, "file_url": f"{MEDIA_BASE_URL}/songs/18.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/18.jpg", "album_name": ""},
]


@router.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    """Загрузить тестовые данные в базу данных."""
    try:
        # Создаем тестового пользователя
        existing_user = db.query(AuthUser).filter(AuthUser.email == TEST_USER["email"]).first()
        if not existing_user:
            user = AuthUser(
                email=TEST_USER["email"],
                password_hash=get_password_hash(TEST_USER["password"])
            )
            db.add(user)
            db.flush()
            
            profile = UserProfile(
                id=user.id,
                username=TEST_USER["username"],
                avatar_url="https://picsum.photos/seed/user/200/200",
                bio="Test user account"
            )
            db.add(profile)
            db.commit()
        else:
            user = existing_user

        # Проверяем, есть ли уже альбомы
        existing_albums = db.query(Album).count()
        if existing_albums > 0:
            return {
                "message": "Database already seeded",
                "user": TEST_USER["email"],
                "albums": existing_albums
            }

        # Создаем альбомы и треки
        for idx, album_data in enumerate(TEST_ALBUMS):
            album = Album(**album_data)
            db.add(album)
            db.flush()

            # Добавляем треки для этого альбома
            start_idx = idx * 3
            for track_data in TEST_TRACKS[start_idx:start_idx + 3]:
                track = Track(
                    title=track_data["title"],
                    artist=track_data["artist"],
                    duration=track_data["duration"],
                    file_url=track_data["file_url"],
                    image_url=track_data["image_url"],
                    album_name=track_data.get("album_name", ""),
                    album_id=album.id
                )
                db.add(track)
            db.commit()

        # Добавляем треки без альбома
        for track_data in TEST_TRACKS[9:]:
            track = Track(
                title=track_data["title"],
                artist=track_data["artist"],
                duration=track_data["duration"],
                file_url=track_data["file_url"],
                image_url=track_data["image_url"],
                album_name=track_data.get("album_name", "")
            )
            db.add(track)
        db.commit()

        # Создаем тестовый плейлист
        playlist = Playlist(
            title="My Favorite Songs",
            owner_id=user.id,
            is_public=True
        )
        db.add(playlist)
        db.flush()
        
        # Добавляем треки в плейлист
        tracks = db.query(Track).limit(5).all()
        for position, track in enumerate(tracks):
            playlist_track = PlaylistTrack(
                playlist_id=playlist.id,
                track_id=track.id,
                position=position
            )
            db.add(playlist_track)
        db.commit()

        return {
            "message": "Database seeded successfully",
            "user": TEST_USER["email"],
            "password": TEST_USER["password"],
            "albums": len(TEST_ALBUMS),
            "tracks": len(TEST_TRACKS),
            "playlists": 1
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
