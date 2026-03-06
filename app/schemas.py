"""Pydantic схемы для API."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, model_validator


# Auth schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str


class TokenData(BaseModel):
    user_id: UUID | None = None
    email: str | None = None


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: UUID
    avatar_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    username: str | None = None
    avatar_url: str | None = None
    bio: str | None = None


# Track schemas
class TrackBase(BaseModel):
    title: str
    artist: str
    duration: int
    file_url: str
    image_url: str | None = None
    album_id: UUID | None = None


class TrackCreate(TrackBase):
    pass


class TrackUpdate(BaseModel):
    title: str | None = None
    artist: str | None = None
    duration: int | None = None
    file_url: str | None = None
    image_url: str | None = None
    album_id: UUID | None = None


class TrackResponse(TrackBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Album schemas
class AlbumBase(BaseModel):
    title: str
    artist: str
    image_url: str
    release_year: int


class AlbumCreate(AlbumBase):
    pass


class AlbumUpdate(BaseModel):
    title: str | None = None
    artist: str | None = None
    image_url: str | None = None
    release_year: int | None = None


class AlbumResponse(AlbumBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    songs: list[TrackResponse] = []

    class Config:
        from_attributes = True


# Message schemas
class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    receiver_id: UUID


class MessageResponse(MessageBase):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Chat schemas
class UserStatusResponse(BaseModel):
    user_id: UUID
    username: str
    avatar_url: str | None = None
    is_online: bool = False
    activity: str | None = None

    class Config:
        from_attributes = True


# Playlist schemas
class PlaylistBase(BaseModel):
    title: str
    owner_id: UUID
    is_public: bool = True


class PlaylistCreate(PlaylistBase):
    pass


class PlaylistUpdate(BaseModel):
    title: str | None = None
    is_public: bool | None = None


class PlaylistTrackAdd(BaseModel):
    track_id: UUID
    position: int | None = None


class PlaylistResponse(PlaylistBase):
    id: UUID
    created_at: datetime
    tracks: list[TrackResponse] = []

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def convert_tracks(cls, data):
        """Convert PlaylistTrack to Track for serialization."""
        if hasattr(data, "tracks") and not isinstance(data, dict):
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


# Search schemas
class ArtistSearchResult(BaseModel):
    name: str


class SearchResponse(BaseModel):
    tracks: list[TrackResponse]
    albums: list[AlbumResponse]
    artists: list[ArtistSearchResult]
