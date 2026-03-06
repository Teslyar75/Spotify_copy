"""Album Service — albums."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Album(Base):
    __tablename__ = "albums"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    artist = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=False)
    release_year = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    songs = relationship("Track", back_populates="album_ref", cascade="all, delete-orphan")
