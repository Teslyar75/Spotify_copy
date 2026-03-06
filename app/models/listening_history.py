"""Player / History Service — listening_history."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ListeningHistory(Base):
    __tablename__ = "listening_history"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    track_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tracks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    played_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("UserProfile", back_populates="listening_history")
    track = relationship("Track", back_populates="listening_history")
