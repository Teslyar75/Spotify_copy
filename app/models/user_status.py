"""Chat Service — user activities and online status tracking."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.database import Base


class UserStatus(Base):
    """Tracks online status and current activity of users."""
    __tablename__ = "user_statuses"

    user_id = Column(PG_UUID(as_uuid=True), primary_key=True)
    is_online = Column(Boolean, default=False)
    current_activity = Column(String(500), nullable=True)  # e.g., "Playing Song Title by Artist"
    last_seen = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
