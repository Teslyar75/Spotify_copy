"""
Модель Stake — ставки слушателей на контент (тотализатор).

Обычный слушатель (не автор) может поставить звёзды на:
- Трек
- Скин
- Связку скин+трек (bundle)

Если контент «выстреливает» — слушатель получает бонус по формуле.
Если «выгорает» — получает меньший возврат.

Формула выплат (документированная):
- Выстрелил (hit): возврат ставки + 50% бонус
- Выгорел (burned): возврат 20% ставки
- Активный (active): ставка заморожена
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Stake(Base):
    __tablename__ = "stakes"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    
    # Пользователь (слушатель, делающий ставку)
    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Тип ставки: track, skin, bundle
    target_type = Column(String(20), nullable=False, index=True)
    
    # ID целевого объекта
    target_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    
    # Сумма ставки в звёздах (1, 2, или 5)
    stars_amount = Column(Integer, nullable=False)
    
    # Статус выплаты: pending, paid_hit, paid_burned
    payout_status = Column(String(20), nullable=False, default="pending")
    
    # Сумма выплаты (рассчитывается при изменении статуса контента)
    payout_amount = Column(Integer, nullable=False, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Связи
    user = relationship("UserProfile", back_populates="stakes")
