"""Message Service — chat messages."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, func, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(PG_UUID(as_uuid=True), ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(PG_UUID(as_uuid=True), ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    sender = relationship("AuthUser", foreign_keys=[sender_id])
    receiver = relationship("AuthUser", foreign_keys=[receiver_id])
