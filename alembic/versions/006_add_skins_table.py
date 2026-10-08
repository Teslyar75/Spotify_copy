"""add skins table

Revision ID: 006_add_skins_table
Revises: 005_add_track_genre
Create Date: 2026-10-08 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006_add_skins_table'
down_revision = '005_add_track_genre'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем поле stars_balance в user_profiles
    op.add_column('user_profiles', sa.Column('stars_balance', sa.Integer(), nullable=False, server_default='100'))
    
    # Добавляем поля для тотализатора в tracks
    op.add_column('tracks', sa.Column('uploader_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('tracks', sa.Column('stake_amount', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('tracks', sa.Column('total_supports', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('tracks', sa.Column('tote_status', sa.String(20), nullable=False, server_default='active'))
    op.create_foreign_key('fk_tracks_uploader', 'tracks', 'user_profiles', ['uploader_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_tracks_uploader_id'), 'tracks', ['uploader_id'], unique=False)
    
    # Создаём таблицу skins
    op.create_table('skins',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('banner_url', sa.String(length=255), nullable=True),
        sa.Column('background_url', sa.String(length=255), nullable=True),
        sa.Column('thumbnail_url', sa.String(length=255), nullable=True),
        sa.Column('button_style', sa.String(length=50), nullable=False, server_default='round'),
        sa.Column('accent_color', sa.String(length=20), nullable=True),
        sa.Column('accent_secondary', sa.String(length=20), nullable=True),
        sa.Column('animation_type', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('is_public', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('is_preset', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('price_stars', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('stake_amount', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_supports', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tote_status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_skins_owner_id'), 'skins', ['owner_id'], unique=False)
    
    # Добавляем поле active_skin_id в user_profiles
    op.add_column('user_profiles', sa.Column('active_skin_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_user_profiles_active_skin', 'user_profiles', 'skins', ['active_skin_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_user_profiles_active_skin_id'), 'user_profiles', ['active_skin_id'], unique=False)
    
    # Создаём таблицу skin_entitlements (права на использование скинов)
    op.create_table('skin_entitlements',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('skin_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skin_id'], ['skins.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_skin_entitlements_user_id'), 'skin_entitlements', ['user_id'], unique=False)
    op.create_index(op.f('ix_skin_entitlements_skin_id'), 'skin_entitlements', ['skin_id'], unique=False)
    
    # Создаём таблицу track_supports (поддержка треков)
    op.create_table('track_supports',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('track_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['track_id'], ['tracks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_track_supports_user_id'), 'track_supports', ['user_id'], unique=False)
    op.create_index(op.f('ix_track_supports_track_id'), 'track_supports', ['track_id'], unique=False)
    
    # Создаём таблицу track_skins (связь многие-ко-многим)
    op.create_table('track_skins',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('track_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('skin_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['track_id'], ['tracks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skin_id'], ['skins.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_track_skins_track_id'), 'track_skins', ['track_id'], unique=False)
    op.create_index(op.f('ix_track_skins_skin_id'), 'track_skins', ['skin_id'], unique=False)
    
    # Создаём таблицу promotions (продвижение контента)
    op.create_table('promotions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('target_type', sa.String(20), nullable=False),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stars_spent', sa.Integer(), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_promotions_owner_id'), 'promotions', ['owner_id'], unique=False)
    op.create_index(op.f('ix_promotions_target_type'), 'promotions', ['target_type'], unique=False)
    op.create_index(op.f('ix_promotions_target_id'), 'promotions', ['target_id'], unique=False)
    
    # Создаём таблицу stakes (ставки слушателей)
    op.create_table('stakes',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('target_type', sa.String(20), nullable=False),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stars_amount', sa.Integer(), nullable=False),
        sa.Column('payout_status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('payout_amount', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stakes_user_id'), 'stakes', ['user_id'], unique=False)
    op.create_index(op.f('ix_stakes_target_type'), 'stakes', ['target_type'], unique=False)
    op.create_index(op.f('ix_stakes_target_id'), 'stakes', ['target_id'], unique=False)
    
    # Создаём встроенные preset-скины (Стандартный — первый в списке, default для новых пользователей)
    op.execute("""
        INSERT INTO skins (name, description, banner_url, background_url, thumbnail_url, button_style, accent_color, accent_secondary, animation_type, is_public, is_preset, price_stars, owner_id)
        VALUES 
            ('Стандартный', 'Чистый нейтральный дизайн без тематического оформления', NULL, NULL, NULL, 'round', '#1DB954', '#1ed760', 'none', true, true, 0, NULL),
            ('Классический Spotify', 'Тёмная тема с зелёными акцентами', NULL, NULL, NULL, 'round', '#1DB954', '#1ed760', 'none', true, true, 0, NULL),
            ('Неоновая Ночь', 'Киберпанк с неоновыми контурами', NULL, NULL, NULL, 'outline', '#00FFFF', '#FF00FF', 'gradient-blobs', true, true, 0, NULL),
            ('Ретро Волны', 'Синтвейв стиль с пульсирующей анимацией', NULL, NULL, NULL, 'pill', '#FF6EC7', '#7B2CBF', 'waveform', true, true, 0, NULL),
            ('Минимализм', 'Чистый дизайн без отвлекающих элементов', '/skins/minimalism_banner.webp', '/skins/minimalism_bg.webp', NULL, 'minimal', '#F5F5F5', '#E0E0E0', 'particles', true, true, 0, NULL),
            ('Космос', 'Звёздное пространство с фиолетовыми оттенками', '/skins/cosmos_banner.webp', '/skins/cosmos_bg.webp', NULL, 'round', '#8B5CF6', '#A78BFA', 'particles', true, true, 0, NULL),
            ('Закат', 'Тёплые оранжево-розовые тона', '/skins/sunset_banner.webp', '/skins/sunset_bg.webp', NULL, 'pill', '#FF6B6B', '#FFB347', 'gradient-blobs', true, true, 0, NULL),
            ('Броня гения', 'Красно-золотой tech HUD', '/skins/irontech_banner.webp', '/skins/irontech_bg.webp', NULL, 'square', '#C41E3A', '#FFD700', 'particles', true, true, 0, NULL),
            ('Ночной паутинщик', 'Красно-синий городской пейзаж', '/skins/spider_banner.webp', '/skins/spider_bg.webp', NULL, 'outline', '#8B0000', '#4682B4', 'gradient-blobs', true, true, 0, NULL),
            ('Бейкер-стрит', 'Викторианский детектив', '/skins/baker_banner.webp', '/skins/baker_bg.webp', NULL, 'round', '#FFBF00', '#8B4513', 'none', true, true, 0, NULL),
            ('Викинги', 'Северные фьорды и драккары', '/skins/vikings_banner.webp', '/skins/vikings_bg.webp', NULL, 'square', '#4682B4', '#708090', 'waveform', true, true, 0, NULL),
            ('Железный трон', 'Средневековый замок', '/skins/thrones_banner.webp', '/skins/thrones_bg.webp', NULL, 'minimal', '#2C2C2C', '#8B0000', 'particles', true, true, 0, NULL),
            ('Звёздный флот', 'Исследование далёких галактик', '/skins/starfleet_banner.webp', '/skins/starfleet_bg.webp', NULL, 'pill', '#4169E1', '#1E90FF', 'particles', true, true, 0, NULL),
            ('Менталист', 'Тёплый минимализм с чайным настроением', '/skins/mentalist_banner.webp', '/skins/mentalist_bg.webp', NULL, 'minimal', '#D4A76A', '#8B7355', 'none', true, true, 0, NULL),
            ('Косплей', 'Яркие цвета аниме-конвенций', '/skins/cosplay_banner.webp', '/skins/cosplay_bg.webp', NULL, 'round', '#FF1493', '#00CED1', 'gradient-blobs', true, true, 0, NULL)
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_stakes_target_id'), table_name='stakes')
    op.drop_index(op.f('ix_stakes_target_type'), table_name='stakes')
    op.drop_index(op.f('ix_stakes_user_id'), table_name='stakes')
    op.drop_table('stakes')
    
    op.drop_index(op.f('ix_promotions_target_id'), table_name='promotions')
    op.drop_index(op.f('ix_promotions_target_type'), table_name='promotions')
    op.drop_index(op.f('ix_promotions_owner_id'), table_name='promotions')
    op.drop_table('promotions')
    
    op.drop_index(op.f('ix_track_skins_skin_id'), table_name='track_skins')
    op.drop_index(op.f('ix_track_skins_track_id'), table_name='track_skins')
    op.drop_table('track_skins')
    
    op.drop_index(op.f('ix_track_supports_track_id'), table_name='track_supports')
    op.drop_index(op.f('ix_track_supports_user_id'), table_name='track_supports')
    op.drop_table('track_supports')
    
    op.drop_index(op.f('ix_skin_entitlements_skin_id'), table_name='skin_entitlements')
    op.drop_index(op.f('ix_skin_entitlements_user_id'), table_name='skin_entitlements')
    op.drop_table('skin_entitlements')
    
    op.drop_index(op.f('ix_user_profiles_active_skin_id'), table_name='user_profiles')
    op.drop_constraint('fk_user_profiles_active_skin', 'user_profiles', type_='foreignkey')
    op.drop_column('user_profiles', 'active_skin_id')
    
    op.drop_index(op.f('ix_skins_owner_id'), table_name='skins')
    op.drop_table('skins')
    
    op.drop_index(op.f('ix_tracks_uploader_id'), table_name='tracks')
    op.drop_constraint('fk_tracks_uploader', 'tracks', type_='foreignkey')
    op.drop_column('tracks', 'tote_status')
    op.drop_column('tracks', 'total_supports')
    op.drop_column('tracks', 'stake_amount')
    op.drop_column('tracks', 'uploader_id')
    
    op.drop_column('user_profiles', 'stars_balance')
