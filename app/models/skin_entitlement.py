"""
Модель SkinEntitlement — права на использование скина.

Пользователь может:
1. Поддержать художника (demo action) — получает доступ к скину
2. Загрузить своё фото — автоматически получает свой скин

Для гостей — localStorage, для зарегистрированных — Postgres.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SkinEntitlement(Base):
    __tablename__ = "skin_entitlements"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    
    # Пользователь
    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Скин
    skin_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("skins.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Сумма поддержки (demo, не реальные деньги)
    # 0.00 для своих загруженных скинов
    amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Связи
    user = relationship("UserProfile", back_populates="skin_entitlements")
    skin = relationship("Skin", back_populates="entitlements")
