"""initial_schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2025-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.create_table(
        "auth_users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_auth_users_email", "auth_users", ["email"], unique=True)

    op.create_table(
        "tracks",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("artist", sa.String(255), nullable=False),
        sa.Column("album", sa.String(255), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("duration > 0", name="check_duration_positive"),
    )
    op.create_index("idx_tracks_artist", "tracks", ["artist"])
    op.create_index("idx_tracks_album", "tracks", ["album"])

    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("avatar_url", sa.String(255), nullable=True),
        sa.Column("bio", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["id"], ["auth_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_user_profiles_username", "user_profiles", ["username"], unique=True)

    op.create_table(
        "playlists",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["auth_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_playlists_owner", "playlists", ["owner_id"])

    op.create_table(
        "playlist_tracks",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("playlist_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("track_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["playlist_id"], ["playlists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["track_id"], ["tracks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("playlist_id", "position", name="uq_playlist_position"),
        sa.CheckConstraint("position >= 0", name="check_position_non_negative"),
    )
    op.create_index("idx_playlist_tracks_playlist", "playlist_tracks", ["playlist_id"])
    op.create_index("idx_playlist_tracks_track", "playlist_tracks", ["track_id"])

    op.create_table(
        "listening_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("track_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("played_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["auth_users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["track_id"], ["tracks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_listening_history_user", "listening_history", ["user_id"])
    op.create_index("idx_listening_history_track", "listening_history", ["track_id"])
    op.create_index("idx_listening_history_played_at", "listening_history", ["played_at"])


def downgrade() -> None:
    op.drop_index("idx_listening_history_played_at", "listening_history")
    op.drop_index("idx_listening_history_track", "listening_history")
    op.drop_index("idx_listening_history_user", "listening_history")
    op.drop_table("listening_history")

    op.drop_index("idx_playlist_tracks_track", "playlist_tracks")
    op.drop_index("idx_playlist_tracks_playlist", "playlist_tracks")
    op.drop_table("playlist_tracks")

    op.drop_index("idx_playlists_owner", "playlists")
    op.drop_table("playlists")

    op.drop_index("idx_user_profiles_username", "user_profiles")
    op.drop_table("user_profiles")

    op.drop_index("idx_tracks_album", "tracks")
    op.drop_index("idx_tracks_artist", "tracks")
    op.drop_table("tracks")

    op.drop_index("idx_auth_users_email", "auth_users")
    op.drop_table("auth_users")

    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
