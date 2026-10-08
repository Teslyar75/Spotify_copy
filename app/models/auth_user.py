"""
Модель AuthUser — учётные данные для входа.

Таблица auth_users хранит:
    - email, password_hash — для входа (bcrypt)
    - initial_username — сохраняется при регистрации, используется при создании UserProfile

Разделение ответственности:
    auth_users  → "ключ от системы" (секретные данные для входа)
    user_profiles → "личность пользователя" (публичные данные)

Связь: 1:1 с UserProfile через Shared Primary Key.
    user_profiles.id == auth_users.id (id профиля = id пользователя)
"""

import uuid

from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AuthUser(Base):
    __tablename__ = "auth_users"

    # UUID как первичный ключ — глобально уникален, не раскрывает порядок создания
    # (в отличие от автоинкрементного integer ID)
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # unique=True — нельзя зарегистрировать два аккаунта с одним email
    # index=True — ускоряет поиск при логине (WHERE email = ?)
    email = Column(String(255), unique=True, nullable=False, index=True)

    # Никогда не храним plain text пароль!
    # Здесь только bcrypt-хеш: $2b$12$...
    # nullable=True для OAuth users (у них нет пароля)
    password_hash = Column(String(255), nullable=True)

    # Сохраняем желаемый username при регистрации.
    # Используется функцией _ensure_profile для создания UserProfile.
    # nullable=True — для обратной совместимости со старыми записями без этого поля.
    initial_username = Column(String(50), nullable=True)
    
    # Google OAuth поля
    google_sub = Column(String(255), unique=True, nullable=True, index=True)  # Google Subject ID
    auth_provider = Column(String(50), nullable=True, server_default='password')  # 'password' or 'google'
    avatar_url = Column(String(500), nullable=True)  # Google profile picture URL

    # server_default=func.now() — PostgreSQL автоматически проставляет текущее время
    # при INSERT. Python не участвует, значит нет проблем с timezone.
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Связь 1:1 с UserProfile.
    # uselist=False — говорит SQLAlchemy, что это один объект, а не список.
    # cascade="all, delete-orphan" — при удалении AuthUser автоматически удаляется UserProfile.
    # back_populates — двусторонняя связь: UserProfile.auth_user ссылается обратно.
    profile = relationship(
        "UserProfile",
        back_populates="auth_user",
        uselist=False,
        cascade="all, delete-orphan",
    )
