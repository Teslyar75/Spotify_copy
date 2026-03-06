"""Playlist Service — playlist_tracks."""

import uuid

from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class PlaylistTrack(Base):
    __tablename__ = "playlist_tracks"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    playlist_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("playlists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    track_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tracks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    position = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("playlist_id", "position", name="uq_playlist_position"),
        CheckConstraint("position >= 0", name="check_position_non_negative"),
    )

    playlist = relationship("Playlist", back_populates="tracks")
    track = relationship("Track", back_populates="playlist_tracks")
