"""FK playlists and listening_history to user_profiles

Revision ID: 003_fk_to_user_profiles
Revises: 002_fix_listening_history_index
Create Date: 2025-03-01

Согласно диаграмме: owner_id и user_id ссылаются на user_profiles.id
"""
from typing import Sequence, Union

from alembic import op

revision: str = "003_fk_to_user_profiles"
down_revision: Union[str, None] = "002_fix_listening_history_index"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # playlists.owner_id: auth_users -> user_profiles
    op.drop_constraint("playlists_owner_id_fkey", "playlists", type_="foreignkey")
    op.create_foreign_key(
        "playlists_owner_id_fkey",
        "playlists",
        "user_profiles",
        ["owner_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # listening_history.user_id: auth_users -> user_profiles
    op.drop_constraint("listening_history_user_id_fkey", "listening_history", type_="foreignkey")
    op.create_foreign_key(
        "listening_history_user_id_fkey",
        "listening_history",
        "user_profiles",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    # listening_history.user_id: user_profiles -> auth_users
    op.drop_constraint("listening_history_user_id_fkey", "listening_history", type_="foreignkey")
    op.create_foreign_key(
        "listening_history_user_id_fkey",
        "listening_history",
        "auth_users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # playlists.owner_id: user_profiles -> auth_users
    op.drop_constraint("playlists_owner_id_fkey", "playlists", type_="foreignkey")
    op.create_foreign_key(
        "playlists_owner_id_fkey",
        "playlists",
        "auth_users",
        ["owner_id"],
        ["id"],
        ondelete="CASCADE",
    )
