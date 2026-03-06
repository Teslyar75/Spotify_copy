-- ============================================
-- Spotify Clone — Основная база данных
-- ============================================

-- Расширение для UUID (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Auth Service — auth_users
-- ============================================
CREATE TABLE auth_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_users_email ON auth_users(email);

-- ============================================
-- User Service — user_profiles
-- ============================================
CREATE TABLE user_profiles (
    id          UUID PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
    username    VARCHAR(50) NOT NULL UNIQUE,
    avatar_url  VARCHAR(255),
    bio         VARCHAR(500),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- ============================================
-- Track Service — tracks
-- ============================================
CREATE TABLE tracks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(255) NOT NULL,
    artist      VARCHAR(255) NOT NULL,
    album       VARCHAR(255) NOT NULL,
    duration    INT NOT NULL CHECK (duration > 0),
    file_url    VARCHAR(500) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracks_artist ON tracks(artist);
CREATE INDEX idx_tracks_album ON tracks(album);

-- ============================================
-- Playlist Service — playlists
-- ============================================
CREATE TABLE playlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    is_public   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_playlists_owner ON playlists(owner_id);

-- ============================================
-- Playlist Service — playlist_tracks
-- ============================================
CREATE TABLE playlist_tracks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id    UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position    INT NOT NULL CHECK (position >= 0),
    UNIQUE(playlist_id, position)
);

CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_track ON playlist_tracks(track_id);

-- ============================================
-- Player / History Service — listening_history
-- ============================================
CREATE TABLE listening_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    track_id    UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listening_history_user ON listening_history(user_id);
CREATE INDEX idx_listening_history_track ON listening_history(track_id);
CREATE INDEX idx_listening_history_played_at ON listening_history(played_at DESC);
