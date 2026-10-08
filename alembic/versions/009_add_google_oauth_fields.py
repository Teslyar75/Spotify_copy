"""add google oauth fields

Revision ID: 009_add_google_oauth_fields
Revises: 007_add_jamendo_rotation
Create Date: 2026-10-08 20:42:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '009_add_google_oauth_fields'
down_revision = '007_add_jamendo_rotation'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем поля для Google OAuth (nullable для существующих пользователей)
    op.add_column('auth_users', sa.Column('google_sub', sa.String(255), nullable=True, unique=True, index=True))
    op.add_column('auth_users', sa.Column('auth_provider', sa.String(50), nullable=True, server_default='password'))
    op.add_column('auth_users', sa.Column('avatar_url', sa.String(500), nullable=True))
    
    # password_hash становится nullable (для OAuth users у которых нет пароля)
    op.alter_column('auth_users', 'password_hash', nullable=True)


def downgrade() -> None:
    op.alter_column('auth_users', 'password_hash', nullable=False)
    op.drop_column('auth_users', 'avatar_url')
    op.drop_column('auth_users', 'auth_provider')
    op.drop_column('auth_users', 'google_sub')
