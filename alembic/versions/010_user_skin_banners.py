"""per-user banner overrides for skins (user_skin_banners)

Revision ID: 010_user_skin_banners
Revises: 008_add_per_page_banners
Create Date: 2026-10-09 00:40:00.000000

Note: 009 is reserved by the (unmerged) Google OAuth branch, whose 009 revises 007.
This revision has its own id and revises 008, so there is no id clash; if both
branches are merged, add an alembic merge revision for the two heads.
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '010_user_skin_banners'
down_revision = '008_add_per_page_banners'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # idempotent: safe to re-run on a DB where the table already exists
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_skin_banners (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
            skin_id UUID NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
            slot VARCHAR(16) NOT NULL CHECK (slot IN ('home', 'search', 'library', 'player')),
            url VARCHAR(255) NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_user_skin_banners_user_skin_slot UNIQUE (user_id, skin_id, slot)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_skin_banners_user_id ON user_skin_banners (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_skin_banners_skin_id ON user_skin_banners (skin_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_skin_banners")
