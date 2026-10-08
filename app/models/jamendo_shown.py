"""
Модель JamendoShown — треки Jamendo, которые уже показывались пользователю.

Для ротации контента: при каждом обновлении показываем новые треки,
которые пользователь ещё не видел.

Для гостей — localStorage.
"""

from sqlalchemy import Column, DateTime, ForeignKey, String, func, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class JamendoShown(Base):
    __tablename__ = "jamendo_shown"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    
    # Пользователь (NULL для гостей — они используют localStorage)
    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Jamendo track ID (стабильная часть URL)
    jamendo_track_id = Column(String(50), nullable=False, index=True)
    
    # Был ли трек воспроизведён (просто показан vs реально прослушан)
    was_played = Column(Boolean, default=False, nullable=False)
    
    # Когда показан/воспроизведён
    shown_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Связи
    user = relationship("UserProfile", back_populates="jamendo_shown_tracks")
