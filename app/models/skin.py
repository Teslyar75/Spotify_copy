"""
Модель Skin — персональные скины плеера.

Каждый пользователь может создавать свои скины и выбирать активный.
Скины определяют внешний вид плеера: баннеры, стиль кнопок, цвета и анимацию.

В будущем добавится marketplace где дизайнеры смогут продавать скины.
"""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class Skin(Base):
    __tablename__ = "skins"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    
    # Владелец скина (опционально — для встроенных скинов owner_id = NULL)
    owner_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Основная информация
    name = Column(String(100), nullable=False)  # Название скина
    description = Column(Text)  # Описание
    
    # Изображения (несколько размеров для оптимизации)
    banner_url = Column(String(255))  # Баннер (широкий, для хедеров)
    background_url = Column(String(255))  # Фон для now-playing screen
    thumbnail_url = Column(String(255))  # Миниатюра для карточек списка скинов
    banners = Column(JSONB, nullable=True)  # {"home","search","library","player"} per-page banners (migration 008)
    
    # Стиль кнопок (CSS-класс)
    button_style = Column(
        String(50), 
        nullable=False, 
        default="round",  # round, square, pill, outline, minimal
    )
    
    # Цветовая схема (JSON-like строки или hex-цвета)
    accent_color = Column(String(20))  # Основной акцентный цвет (hex)
    accent_secondary = Column(String(20))  # Вторичный акцент
    
    # Анимация для no-buttons mode
    animation_type = Column(
        String(50),
        nullable=False,
        default="none",  # none, equalizer, waveform, particles, gradient-blobs
    )
    
    # Флаги для marketplace
    is_public = Column(Boolean, default=False)  # Публичный скин (виден всем)
    is_preset = Column(Boolean, default=False)  # Встроенный preset скин
    
    # Цена в звёздах (для продажи)
    price_stars = Column(Integer, nullable=False, default=0)  # 0 = бесплатный
    
    # Поля для тотализатора (demo)
    stake_amount = Column(Integer, nullable=False, default=0)  # Ставка создателя в звёздах
    total_supports = Column(Integer, nullable=False, default=0)  # Сумма поддержки
    tote_status = Column(String(20), nullable=False, default="active")  # active, hit, burned
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Связи
    owner = relationship("UserProfile", back_populates="skins", foreign_keys=[owner_id])
    users_with_this_skin = relationship("UserProfile", back_populates="active_skin", foreign_keys="UserProfile.active_skin_id")
    entitlements = relationship("SkinEntitlement", back_populates="skin", cascade="all, delete-orphan")
    
    # Прикреплённые треки (многие-ко-многим через TrackSkin)
    track_skins = relationship("TrackSkin", back_populates="skin", cascade="all, delete-orphan")
