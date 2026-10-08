"""
Модель UserSkinBanner — личные фото пользователя поверх баннеров темы.

Пользователь может заменить любой из 4 баннеров тематического скина
(home / search / library / player) своим фото. Оригинальные баннеры темы
(skins.banners) не меняются: при выдаче скина его баннеры склеиваются
с переопределениями пользователя (переопределение побеждает по слоту).
"""

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.database import Base

BANNER_SLOTS = ("home", "search", "library", "player")


class UserSkinBanner(Base):
    __tablename__ = "user_skin_banners"
    __table_args__ = (
        UniqueConstraint("user_id", "skin_id", "slot", name="uq_user_skin_banners_user_skin_slot"),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skin_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("skins.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slot = Column(String(16), nullable=False)  # home | search | library | player
    url = Column(String(255), nullable=False)  # /media/skins/user/<user>/<file>.webp
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
