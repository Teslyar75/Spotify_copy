"""Скрипт для добавления тестовых данных."""

import sys
import os

# Добавляем корень проекта в path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import DATABASE_URL
from app.database import Base
from app.models.auth_user import AuthUser
from app.models.user_profile import UserProfile
from app.models.album import Album
from app.models.track import Track
from app.models.playlist import Playlist
from app.models.playlist_track import PlaylistTrack
from app.utils import get_password_hash

# Тестовые данные
TEST_USER = {
    "email": "test@example.com",
    "password": "test123",
    "username": "testuser"
}

TEST_ALBUMS = [
    {
        "title": "Midnight Vibes",
        "artist": "The Night Owls",
        "image_url": "https://picsum.photos/seed/album1/300/300",
        "release_year": 2023
    },
    {
        "title": "Summer Hits",
        "artist": "Beach Boys",
        "image_url": "https://picsum.photos/seed/album2/300/300",
        "release_year": 2022
    },
    {
        "title": "Electronic Dreams",
        "artist": "Synth Wave",
        "image_url": "https://picsum.photos/seed/album3/300/300",
        "release_year": 2024
    }
]

TEST_TRACKS = [
    # Album 1
    {"title": "Midnight City", "artist": "The Night Owls", "duration": 245, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "image_url": "https://picsum.photos/seed/track1/300/300"},
    {"title": "Dark Streets", "artist": "The Night Owls", "duration": 198, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", "image_url": "https://picsum.photos/seed/track2/300/300"},
    {"title": "Neon Lights", "artist": "The Night Owls", "duration": 223, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", "image_url": "https://picsum.photos/seed/track3/300/300"},
    # Album 2
    {"title": "Ocean Breeze", "artist": "Beach Boys", "duration": 187, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", "image_url": "https://picsum.photos/seed/track4/300/300"},
    {"title": "Sunset Boulevard", "artist": "Beach Boys", "duration": 214, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", "image_url": "https://picsum.photos/seed/track5/300/300"},
    {"title": "Palm Trees", "artist": "Beach Boys", "duration": 201, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", "image_url": "https://picsum.photos/seed/track6/300/300"},
    # Album 3
    {"title": "Digital Love", "artist": "Synth Wave", "duration": 267, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", "image_url": "https://picsum.photos/seed/track7/300/300"},
    {"title": "Cyber Punk", "artist": "Synth Wave", "duration": 189, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", "image_url": "https://picsum.photos/seed/track8/300/300"},
    {"title": "Future World", "artist": "Synth Wave", "duration": 243, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", "image_url": "https://picsum.photos/seed/track9/300/300"},
    # Extra tracks (without album)
    {"title": "Lonely Star", "artist": "Solo Artist", "duration": 195, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", "image_url": "https://picsum.photos/seed/track10/300/300"},
    {"title": "Acoustic Session", "artist": "Unplugged", "duration": 178, "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", "image_url": "https://picsum.photos/seed/track11/300/300"},
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
                avatar_url="https://picsum.photos/seed/user/200/200",
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
        for idx, album_data in enumerate(TEST_ALBUMS):
            album = Album(**album_data)
            db.add(album)
            db.flush()
            print(f"✓ Альбом создан: {album_data['title']}")
            
            # Добавляем треки для этого альбома (3 трека на альбом)
            start_idx = idx * 3
            for track_data in TEST_TRACKS[start_idx:start_idx + 3]:
                track = Track(
                    **track_data,
                    album_id=album.id,
                    album_name=album.title  # <- добавлено \ не отрабатывал seed
                )
                db.add(track)
            db.commit()
        
        # Добавляем треки без альбома
        # print("\nСоздание треков без альбома...")
        # for track_data in TEST_TRACKS[9:]:
        #     track = Track(**track_data)
        #     db.add(track)
        # db.commit()
        # print(f"✓ Создано {len(TEST_TRACKS)} треков")  <- добавлено \ не отрабатывал seed \ логический конфликт треки без альбома не могут быть созданы из-за ограничения NOT NULL в модели Track

        # Создаем тестовый плейлист
        print("\nСоздание тестового плейлиста...")
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
        print("✓ Плейлист создан с 5 треками")

        print("\n✅ Тестовые данные успешно добавлены!")
        print("\nТестовые учетные данные:")
        print(f"  Email: {TEST_USER['email']}")
        print(f"  Password: {TEST_USER['password']}")

    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_test_data()
