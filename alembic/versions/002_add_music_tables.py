"""add albums, user_statuses, messages tables and update tracks

Revision ID: 002_add_music_tables
Revises: 003_fk_to_user_profiles
Create Date: 2026-03-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_add_music_tables'
down_revision: Union[str, None] = '003_fk_to_user_profiles'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create albums table
    op.create_table('albums',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('artist', sa.String(length=255), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('release_year', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create user_statuses table
    op.create_table('user_statuses',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_online', sa.Boolean(), nullable=True),
        sa.Column('current_activity', sa.String(length=500), nullable=True),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('user_id')
    )
    
    # Create messages table
    op.create_table('messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sender_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('receiver_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_sender_id'), 'messages', ['sender_id'], unique=False)
    op.create_index(op.f('ix_messages_receiver_id'), 'messages', ['receiver_id'], unique=False)
    op.create_index(op.f('ix_messages_created_at'), 'messages', ['created_at'], unique=False)
    
    # Update tracks table - add album_id, image_url, updated_at
    op.add_column('tracks', sa.Column('album_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('tracks', sa.Column('image_url', sa.String(length=500), nullable=True))
    op.add_column('tracks', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    
    # Rename album column to album_name and make it nullable
    op.alter_column('tracks', 'album', new_column_name='album_name', existing_nullable=True)
    
    # Create index on album_id
    op.create_index(op.f('ix_tracks_album_id'), 'tracks', ['album_id'], unique=False)
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_tracks_album_id',
        'tracks', 'albums',
        ['album_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Drop foreign key
    op.drop_constraint('fk_tracks_album_id', 'tracks', type_='foreignkey')
    
    # Drop index
    op.drop_index(op.f('ix_tracks_album_id'), table_name='tracks')
    
    # Remove new columns from tracks
    op.add_column('tracks', sa.Column('album', sa.VARCHAR(length=255), autoincrement=False, nullable=True))
    op.drop_column('tracks', 'updated_at')
    op.drop_column('tracks', 'image_url')
    op.drop_column('tracks', 'album_id')
    
    # Recreate album index
    op.create_index('ix_tracks_album', 'tracks', ['album'], unique=False)
    
    # Drop tables
    op.drop_table('messages')
    op.drop_table('user_statuses')
    op.drop_table('albums')
