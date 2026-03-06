"""User Service — user_profiles."""

from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("auth_users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    username = Column(String(50), unique=True, nullable=False, index=True)
    avatar_url = Column(String(255))
    bio = Column(String(500))
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    auth_user = relationship("AuthUser", back_populates="profile")
    playlists = relationship(
        "Playlist", back_populates="owner", cascade="all, delete-orphan"
    )
    listening_history = relationship(
        "ListeningHistory", back_populates="user", cascade="all, delete-orphan"
    )
