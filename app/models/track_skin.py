"""
Модель TrackSkin — связь треков и скинов (многие-ко-многим).

Пользователь может прикрепить свои скины к загруженным трекам.
При воспроизведении трека показывается прикреплённый скин.
"""

from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TrackSkin(Base):
    __tablename__ = "track_skins"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    
    track_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tracks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    skin_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("skins.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Связи
    track = relationship("Track", back_populates="track_skins")
    skin = relationship("Skin", back_populates="track_skins")
