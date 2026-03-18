"""
Модель Track — музыкальный трек.

Трек может:
  - принадлежать альбому (album_id != None)
  - быть синглом (album_id = None)

При удалении альбома: album_id становится NULL (SET NULL), трек остаётся.
Это важно: трек не должен исчезнуть из плейлистов пользователей только потому,
что администратор удалил альбом.

Денормализация: album_name хранится прямо в треке (дубликат из albums.title).
Это позволяет искать треки по названию альбома без JOIN.
"""

import uuid

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Track(Base):
    __tablename__ = "tracks"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title  = Column(String(255), nullable=False)
    artist = Column(String(255), nullable=False, index=True)  # индекс — часто ищем по артисту

    # Денормализованное поле: дублирует albums.title для быстрого поиска без JOIN.
    # Обновляется при изменении названия альбома (в PUT /api/albums/{id}).
    album_name = Column(String(255), nullable=True, index=True)

    # FK на albums.id. ondelete="SET NULL" — при удалении альбома ставим NULL (не удаляем трек).
    album_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("albums.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    image_url = Column(String(500), nullable=True)   # обложка трека (может наследоваться от альбома)
    genre     = Column(String(100), nullable=True, index=True)  # жанр (rock, pop, jazz...) — для фильтра в поиске
    duration  = Column(Integer, nullable=False)       # длительность в секундах
    file_url  = Column(String(500), nullable=False)   # URL аудиофайла (/media/songs/... или SoundHelix)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),  # автоматически обновляется при каждом UPDATE
        nullable=False,
    )

    # Ограничение на уровне БД: длительность должна быть > 0.
    # Второй уровень защиты после Pydantic-валидации — даже если обойти API, БД откажет.
    __table_args__ = (CheckConstraint("duration > 0", name="check_duration_positive"),)

    # Связь с Album (многие треки → один альбом)
    # back_populates="songs" — обратная сторона Album.songs
    album_ref = relationship("Album", back_populates="songs")

    # Связь с PlaylistTrack (многие-ко-многим через промежуточную таблицу)
    # cascade="all, delete-orphan" — при удалении трека удаляются записи в playlist_tracks
    playlist_tracks = relationship(
        "PlaylistTrack", back_populates="track", cascade="all, delete-orphan"
    )

    # При удалении трека — удаляются записи в listening_history
    listening_history = relationship(
        "ListeningHistory", back_populates="track", cascade="all, delete-orphan"
    )
