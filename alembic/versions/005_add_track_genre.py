"""add genre column to tracks

Revision ID: 005_add_track_genre
Revises: 6c885fc11b07
Create Date: 2026-03-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005_add_track_genre"
down_revision: Union[str, None] = "6c885fc11b07"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tracks", sa.Column("genre", sa.String(length=100), nullable=True))
    op.create_index("ix_tracks_genre", "tracks", ["genre"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_tracks_genre", table_name="tracks")
    op.drop_column("tracks", "genre")
