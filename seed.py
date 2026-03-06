"""Скрипт для загрузки тестовых данных с реальными медиафайлами из Spotify-version."""

import sys
import os

# Добавляем корень проекта в path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import DATABASE_URL
from app.models.auth_user import AuthUser
from app.models.user_profile import UserProfile
from app.models.album import Album
from app.models.track import Track
from app.models.playlist import Playlist
from app.models.playlist_track import PlaylistTrack
from app.utils import get_password_hash

# Базовый URL для медиафайлов (будет заменен на правильный в Docker)
MEDIA_BASE_URL = "/media"

# Тестовые данные из Spotify-version
TEST_USER = {
    "email": "test@example.com",
    "password": "test123",
    "username": "testuser"
}

# Альбомы из seeds/albums.js
ALBUMS_DATA = [
    {
        "title": "Urban Nights",
        "artist": "Various Artists",
        "image_url": f"{MEDIA_BASE_URL}/albums/1.jpg",
        "release_year": 2024
    },
    {
        "title": "Coastal Dreaming",
        "artist": "Various Artists",
        "image_url": f"{MEDIA_BASE_URL}/albums/2.jpg",
        "release_year": 2024
    },
    {
        "title": "Midnight Sessions",
        "artist": "Various Artists",
        "image_url": f"{MEDIA_BASE_URL}/albums/3.jpg",
        "release_year": 2024
    },
    {
        "title": "Eastern Dreams",
        "artist": "Various Artists",
        "image_url": f"{MEDIA_BASE_URL}/albums/4.jpg",
        "release_year": 2024
    }
]

# Треки из seeds/songs.js и seeds/albums.js
TRACKS_DATA = [
    # Album 1: Urban Nights (треки 1-4)
    {"title": "City Rain", "artist": "Urban Echo", "duration": 39, "file_url": f"{MEDIA_BASE_URL}/songs/7.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/7.jpg"},
    {"title": "Neon Lights", "artist": "Night Runners", "duration": 36, "file_url": f"{MEDIA_BASE_URL}/songs/5.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/5.jpg"},
    {"title": "Urban Jungle", "artist": "City Lights", "duration": 36, "file_url": f"{MEDIA_BASE_URL}/songs/15.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/15.jpg"},
    {"title": "Neon Dreams", "artist": "Cyber Pulse", "duration": 39, "file_url": f"{MEDIA_BASE_URL}/songs/13.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/13.jpg"},
    
    # Album 2: Coastal Dreaming (треки 5-8)
    {"title": "Summer Daze", "artist": "Coastal Kids", "duration": 24, "file_url": f"{MEDIA_BASE_URL}/songs/4.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/4.jpg"},
    {"title": "Ocean Waves", "artist": "Coastal Drift", "duration": 28, "file_url": f"{MEDIA_BASE_URL}/songs/9.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/9.jpg"},
    {"title": "Crystal Rain", "artist": "Echo Valley", "duration": 39, "file_url": f"{MEDIA_BASE_URL}/songs/16.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/16.jpg"},
    {"title": "Starlight", "artist": "Luna Bay", "duration": 30, "file_url": f"{MEDIA_BASE_URL}/songs/10.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/10.jpg"},
    
    # Album 3: Midnight Sessions (треки 9-11)
    {"title": "Stay With Me", "artist": "Sarah Mitchell", "duration": 46, "file_url": f"{MEDIA_BASE_URL}/songs/1.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/1.jpg"},
    {"title": "Midnight Drive", "artist": "The Wanderers", "duration": 41, "file_url": f"{MEDIA_BASE_URL}/songs/2.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/2.jpg"},
    {"title": "Moonlight Dance", "artist": "Silver Shadows", "duration": 27, "file_url": f"{MEDIA_BASE_URL}/songs/14.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/14.jpg"},
    
    # Album 4: Eastern Dreams (треки 12-14)
    {"title": "Lost in Tokyo", "artist": "Electric Dreams", "duration": 24, "file_url": f"{MEDIA_BASE_URL}/songs/3.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/3.jpg"},
    {"title": "Neon Tokyo", "artist": "Future Pulse", "duration": 39, "file_url": f"{MEDIA_BASE_URL}/songs/17.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/17.jpg"},
    {"title": "Purple Sunset", "artist": "Dream Valley", "duration": 17, "file_url": f"{MEDIA_BASE_URL}/songs/12.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/12.jpg"},
    
    # Дополнительные треки без альбома
    {"title": "Mountain High", "artist": "The Wild Ones", "duration": 40, "file_url": f"{MEDIA_BASE_URL}/songs/6.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/6.jpg"},
    {"title": "Desert Wind", "artist": "Sahara Sons", "duration": 28, "file_url": f"{MEDIA_BASE_URL}/songs/8.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/8.jpg"},
    {"title": "Winter Dreams", "artist": "Arctic Pulse", "duration": 29, "file_url": f"{MEDIA_BASE_URL}/songs/11.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/11.jpg"},
    {"title": "Midnight Blues", "artist": "Jazz Cats", "duration": 29, "file_url": f"{MEDIA_BASE_URL}/songs/18.mp3", "image_url": f"{MEDIA_BASE_URL}/cover-images/18.jpg"},
]


def create_test_data():
    """Создание тестовых данных."""
    print("Подключение к базе данных...")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Создаем тестового пользователя
        print("Создание тестового пользователя...")
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
                avatar_url=f"{MEDIA_BASE_URL}/cover-images/1.jpg",
                bio="Test user account"
            )
            db.add(profile)
            db.commit()
            print(f"✓ Пользователь создан: {TEST_USER['email']} / {TEST_USER['password']}")
        else:
            print("✓ Пользователь уже существует")
            user = existing_user

        # Создаем альбомы и треки
        print("\nСоздание альбомов и треков...")
        for idx, album_data in enumerate(ALBUMS_DATA):
            album = Album(**album_data)
            db.add(album)
            db.flush()
            print(f"✓ Альбом создан: {album_data['title']}")
            
            # Добавляем треки для этого альбома (4 трека на альбом)
            start_idx = idx * 4
            for track_data in TRACKS_DATA[start_idx:start_idx + 4]:
                track = Track(
                    **track_data,
                    album_id=album.id,
                    album_name=album_data['title']
                )
                db.add(track)
            db.commit()
        
        # Добавляем треки без альбома
        print("\nСоздание треков без альбома...")
        extra_tracks = TRACKS_DATA[16:]
        for track_data in extra_tracks:
            track = Track(
                **track_data,
                album_id=None,
                album_name=""
            )
            db.add(track)
        db.commit()
        print(f"✓ Создано {len(extra_tracks)} треков без альбома")

        # Создаем тестовый плейлист
        print("\nСоздание тестового плейлиста...")
        playlist = Playlist(
            title="My Favorite Songs",
            owner_id=user.id,
            is_public=True
        )
        db.add(playlist)
        db.flush()
        
        # Добавляем первые 5 треков в плейлист
        tracks = db.query(Track).limit(5).all()
        for position, track in enumerate(tracks):
            playlist_track = PlaylistTrack(
                playlist_id=playlist.id,
                track_id=track.id,
                position=position
            )
            db.add(playlist_track)
        db.commit()
        print("✓ Плейлист создан с 5 треками")

        print("\n✅ Тестовые данные успешно добавлены!")
        print("\nТестовые учетные данные:")
        print(f"  Email: {TEST_USER['email']}")
        print(f"  Password: {TEST_USER['password']}")
        print(f"\nМедиафайлы доступны по пути: {MEDIA_BASE_URL}/")
        print(f"  - Альбомы: {MEDIA_BASE_URL}/albums/")
        print(f"  - Обложки: {MEDIA_BASE_URL}/cover-images/")
        print(f"  - Треки: {MEDIA_BASE_URL}/songs/")

    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_test_data()
