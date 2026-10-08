"""add jamendo rotation tracking

Revision ID: 007_add_jamendo_rotation
Revises: 006_add_skins_table
Create Date: 2026-10-08 19:43:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_add_jamendo_rotation'
down_revision = '006_add_skins_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаём таблицу jamendo_shown для отслеживания показанных треков
    op.create_table('jamendo_shown',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('jamendo_track_id', sa.String(50), nullable=False),
        sa.Column('was_played', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('shown_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_jamendo_shown_user_id'), 'jamendo_shown', ['user_id'], unique=False)
    op.create_index(op.f('ix_jamendo_shown_jamendo_track_id'), 'jamendo_shown', ['jamendo_track_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_jamendo_shown_jamendo_track_id'), table_name='jamendo_shown')
    op.drop_index(op.f('ix_jamendo_shown_user_id'), table_name='jamendo_shown')
    op.drop_table('jamendo_shown')
