"""
Pydantic схемы для API.

Схемы выполняют три роли:
  1. ВАЛИДАЦИЯ входящих данных (тело запроса, query-параметры)
  2. СЕРИАЛИЗАЦИЯ исходящих данных (ORM-объект → JSON)
  3. ДОКУМЕНТАЦИЯ — Swagger автоматически строит описание из схем

Соглашение об именовании:
  - Base    — общие поля, от него наследуются Create и Response
  - Create  — поля для создания объекта (входящий запрос)
  - Update  — поля для обновления (все Optional — можно передать любое подмножество)
  - Response — поля ответа API (может включать id, created_at и т.д.)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, model_validator


# ══════════════════════════════════════════════
# AUTH — аутентификация
# ══════════════════════════════════════════════

class Token(BaseModel):
    """Ответ при успешном логине/регистрации — два токена."""
    access_token: str
    refresh_token: str


class LoginUserInfo(BaseModel):
    """Публичные данные пользователя, возвращаемые вместе с токенами."""
    id: UUID
    email: str
    username: str
    avatar_url: str | None = None


class TokenWithUser(Token):
    """Расширенный ответ логина: токены + данные пользователя."""
    user: LoginUserInfo


class TokenData(BaseModel):
    """Данные, извлечённые из JWT payload (используется внутри)."""
    user_id: UUID | None = None
    email: str | None = None


class UserBase(BaseModel):
    """Общие поля пользователя."""
    email: EmailStr   # EmailStr — Pydantic автоматически валидирует формат email
    username: str


class UserCreate(UserBase):
    """Тело запроса для регистрации: email + username + пароль."""
    password: str  # хранится только хеш, plain text нигде не сохраняется


class UserLogin(BaseModel):
    """Тело запроса для входа."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Ответ с данными пользователя (без пароля!)."""
    id: UUID
    avatar_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True  # разрешает создание из ORM-объекта (SQLAlchemy model)


class UserUpdate(BaseModel):
    """Тело запроса для обновления профиля. Все поля опциональны — обновляется только переданное."""
    username: str | None = None
    avatar_url: str | None = None
    bio: str | None = None


class UserProfileResponse(BaseModel):
    """Публичный профиль пользователя (без email — он в auth_users, не в user_profiles)."""
    id: UUID
    username: str
    avatar_url: str | None = None
    bio: str | None = None

    class Config:
        from_attributes = True


# ══════════════════════════════════════════════
# TRACKS — треки
# ══════════════════════════════════════════════

class TrackBase(BaseModel):
    """Общие поля трека."""
    title: str
    artist: str
    duration: int         # длительность в секундах
    file_url: str         # URL аудиофайла
    image_url: str | None = None   # обложка трека (может наследоваться от альбома)
    genre: str | None = None       # жанр (rock, pop, jazz...) — для фильтра в поиске
    album_id: UUID | None = None   # None = трек-сингл, не принадлежит альбому


class TrackCreate(TrackBase):
    """Тело запроса для создания трека. album_name не передаётся — вычисляется на backend."""
    pass


class TrackUpdate(BaseModel):
    """Тело запроса для обновления трека. Все поля опциональны."""
    title: str | None = None
    artist: str | None = None
    duration: int | None = None
    file_url: str | None = None
    image_url: str | None = None
    genre: str | None = None
    album_id: UUID | None = None


class TrackResponse(TrackBase):
    """Ответ API с данными трека. Включает id и временные метки."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlayRecord(BaseModel):
    """Тело запроса POST /api/player/play — фиксация факта прослушивания."""
    track_id: UUID


# ══════════════════════════════════════════════
# ALBUMS — альбомы
# ══════════════════════════════════════════════

class AlbumBase(BaseModel):
    """Общие поля альбома."""
    title: str
    artist: str
    image_url: str      # обложка альбома (обязательна)
    release_year: int


class AlbumCreate(AlbumBase):
    """Тело запроса для создания альбома."""
    pass


class AlbumUpdate(BaseModel):
    """Тело запроса для обновления альбома. Все поля опциональны."""
    title: str | None = None
    artist: str | None = None
    image_url: str | None = None
    release_year: int | None = None


class AlbumResponse(AlbumBase):
    """Ответ API с данными альбома, включая вложенные треки."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    songs: list[TrackResponse] = []   # треки альбома (загружаются через relationship)

    class Config:
        from_attributes = True


# ══════════════════════════════════════════════
# MESSAGES — личные сообщения (чат)
# ══════════════════════════════════════════════

class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    receiver_id: UUID


class MessageResponse(MessageBase):
    """Ответ с данными сообщения (отправитель + получатель + время)."""
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ══════════════════════════════════════════════
# USER STATUS — онлайн-статус (WebSocket)
# ══════════════════════════════════════════════

class UserStatusResponse(BaseModel):
    """Статус пользователя для отображения в чате (онлайн/офлайн + активность)."""
    user_id: UUID
    username: str
    avatar_url: str | None = None
    is_online: bool = False
    activity: str | None = None    # например "Слушает: Song Name"

    class Config:
        from_attributes = True


# ══════════════════════════════════════════════
# PLAYLISTS — плейлисты
# ══════════════════════════════════════════════

class PlaylistBase(BaseModel):
    """Общие поля плейлиста."""
    title: str
    owner_id: UUID
    is_public: bool = True


class PlaylistCreate(BaseModel):
    """
    Тело запроса для создания плейлиста.
    owner_id не передаётся клиентом — берётся из JWT токена на backend.
    """
    title: str
    is_public: bool = True


class PlaylistUpdate(BaseModel):
    """Тело запроса для обновления плейлиста. Все поля опциональны."""
    title: str | None = None
    is_public: bool | None = None


class PlaylistTrackAdd(BaseModel):
    """Тело запроса для добавления трека в плейлист."""
    track_id: UUID
    position: int | None = None   # None = добавить в конец


class PlaylistResponse(PlaylistBase):
    """
    Ответ API с данными плейлиста, включая упорядоченные треки.

    model_validator нужен из-за особенности модели:
    в БД треки хранятся как PlaylistTrack (с полем position),
    а в ответе нужны просто Track-объекты, отсортированные по position.
    """
    id: UUID
    created_at: datetime
    tracks: list[TrackResponse] = []

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def convert_tracks(cls, data):
        """
        Преобразует список PlaylistTrack → список Track перед сериализацией.

        SQLAlchemy возвращает playlist.tracks как список PlaylistTrack (связующих объектов).
        Нам нужен список Track, отсортированный по PlaylistTrack.position.
        Этот validator выполняется автоматически при model_validate(playlist_orm_object).
        """
        if hasattr(data, "tracks") and not isinstance(data, dict):
            # Сортируем по position и достаём вложенный трек из каждого PlaylistTrack
            sorted_tracks = sorted(data.tracks, key=lambda pt: pt.position)
            tracks = [TrackResponse.model_validate(pt.track) for pt in sorted_tracks]
            return {
                "id": data.id,
                "title": data.title,
                "owner_id": data.owner_id,
                "is_public": data.is_public,
                "created_at": data.created_at,
                "tracks": tracks,
            }
        return data


# ══════════════════════════════════════════════
# SEARCH — поиск
# ══════════════════════════════════════════════

class ArtistSearchResult(BaseModel):
    """Результат поиска по артисту — только имя (нет отдельной таблицы артистов)."""
    name: str


class SearchResponse(BaseModel):
    """Полный ответ поиска: треки + альбомы + артисты."""
    tracks: list[TrackResponse]
    albums: list[AlbumResponse]
    artists: list[ArtistSearchResult]
