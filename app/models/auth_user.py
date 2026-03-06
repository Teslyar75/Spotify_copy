"""Auth Service — auth_users."""

import uuid

from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AuthUser(Base):
    __tablename__ = "auth_users"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    profile = relationship(
        "UserProfile",
        back_populates="auth_user",
        uselist=False,
        cascade="all, delete-orphan",
    )
