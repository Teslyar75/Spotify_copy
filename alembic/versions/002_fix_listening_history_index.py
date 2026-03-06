"""fix listening_history played_at index to DESC

Revision ID: 002_fix_listening_history_index
Revises: 001_initial_schema
Create Date: 2025-03-01

"""
from typing import Sequence, Union

from alembic import op

revision: str = "002_fix_listening_history_index"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("idx_listening_history_played_at", "listening_history")
    op.execute("CREATE INDEX idx_listening_history_played_at ON listening_history(played_at DESC)")


def downgrade() -> None:
    op.drop_index("idx_listening_history_played_at", "listening_history")
    op.create_index("idx_listening_history_played_at", "listening_history", ["played_at"])
