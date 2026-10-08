"""
Модель Promotion — продвижение контента за виртуальные звёзды.

Пользователь может продвигать:
- Себя как музыканта (artist profile)
- Свои скины как дизайнер
- Свои загруженные треки
- Связки скин+трек (bundle)

Продвигаемый контент появляется в специальной полке «Продвигается» на главной.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    
    # Владелец продвижения
    owner_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Тип контента: artist, skin, track, bundle
    target_type = Column(String(20), nullable=False, index=True)
    
    # ID целевого объекта (зависит от target_type)
    # artist → user_id, skin → skin_id, track → track_id, bundle → track_id (с прикреплёнными скинами)
    target_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    
    # Стоимость продвижения в звёздах
    stars_spent = Column(Integer, nullable=False)
    
    # Период действия
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Связи
    owner = relationship("UserProfile", back_populates="promotions")
