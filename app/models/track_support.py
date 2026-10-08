"""
Модель TrackSupport — поддержка треков слушателями.

Аналогично скинам: demo action (не реальные деньги), записываем факт поддержки.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TrackSupport(Base):
    __tablename__ = "track_supports"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    
    # Пользователь (слушатель)
    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Трек
    track_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tracks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Сумма поддержки (demo)
    amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Связи
    user = relationship("UserProfile", back_populates="track_supports")
    track = relationship("Track", back_populates="supports")
