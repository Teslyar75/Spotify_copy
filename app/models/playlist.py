"""Playlist Service — playlists."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    is_public = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    owner = relationship("UserProfile", back_populates="playlists")
    tracks = relationship(
        "PlaylistTrack",
        back_populates="playlist",
        order_by="PlaylistTrack.position",
        cascade="all, delete-orphan",
    )
