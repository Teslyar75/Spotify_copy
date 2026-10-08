"""add per-page banners to skins

Revision ID: 008_add_per_page_banners
Revises: 007_add_jamendo_rotation
Create Date: 2026-10-08 20:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json

# revision identifiers, used by Alembic.
revision = '008_add_per_page_banners'
down_revision = '007_add_jamendo_rotation'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем JSON поле для 4 баннеров (home, search, library, album)
    op.add_column('skins', sa.Column('banners', postgresql.JSONB, nullable=True))
    
    # Upsert всех preset скинов с 4 баннерами для каждого
    # Используем ON CONFLICT для обновления существующих и вставки новых
    op.execute("""
        INSERT INTO skins (name, description, banner_url, background_url, thumbnail_url, button_style, accent_color, accent_secondary, animation_type, is_public, is_preset, price_stars, banners, owner_id)
        VALUES 
            ('Стандартный', 'Чистый нейтральный дизайн без тематического оформления', '/skins/standard/home.webp', '/skins/minimalism_bg.webp', NULL, 'round', '#1DB954', '#1ed760', 'none', true, true, 0, 
             '{"home": "/skins/standard/home.webp", "search": "/skins/standard/search.webp", "library": "/skins/standard/library.webp", "album": "/skins/standard/album.webp"}'::jsonb, NULL),
            
            ('Классический Spotify', 'Тёмная тема с зелёными акцентами', '/skins/spotify/home.webp', '/skins/cosmos_bg.webp', NULL, 'round', '#1DB954', '#1ed760', 'none', true, true, 0,
             '{"home": "/skins/spotify/home.webp", "search": "/skins/spotify/search.webp", "library": "/skins/spotify/library.webp", "album": "/skins/spotify/album.webp"}'::jsonb, NULL),
            
            ('Неоновая Ночь', 'Киберпанк с неоновыми контурами', '/skins/neon/home.webp', '/skins/cosmos_bg.webp', NULL, 'outline', '#00FFFF', '#FF00FF', 'gradient-blobs', true, true, 0,
             '{"home": "/skins/neon/home.webp", "search": "/skins/neon/search.webp", "library": "/skins/neon/library.webp", "album": "/skins/neon/album.webp"}'::jsonb, NULL),
            
            ('Ретро Волны', 'Синтвейв стиль с пульсирующей анимацией', '/skins/retro/home.webp', '/skins/sunset_bg.webp', NULL, 'pill', '#FF6EC7', '#7B2CBF', 'waveform', true, true, 0,
             '{"home": "/skins/retro/home.webp", "search": "/skins/retro/search.webp", "library": "/skins/retro/library.webp", "album": "/skins/retro/album.webp"}'::jsonb, NULL),
            
            ('Минимализм', 'Чистый дизайн без отвлекающих элементов', '/skins/minimalism/home.webp', '/skins/minimalism_bg.webp', NULL, 'minimal', '#F5F5F5', '#E0E0E0', 'particles', true, true, 0,
             '{"home": "/skins/minimalism/home.webp", "search": "/skins/minimalism/search.webp", "library": "/skins/minimalism/library.webp", "album": "/skins/minimalism/album.webp"}'::jsonb, NULL),
            
            ('Космос', 'Звёздное пространство с фиолетовыми оттенками', '/skins/cosmos/home.webp', '/skins/cosmos_bg.webp', NULL, 'round', '#8B5CF6', '#A78BFA', 'particles', true, true, 0,
             '{"home": "/skins/cosmos/home.webp", "search": "/skins/cosmos/search.webp", "library": "/skins/cosmos/library.webp", "album": "/skins/cosmos/album.webp"}'::jsonb, NULL),
            
            ('Закат', 'Тёплые оранжево-розовые тона', '/skins/sunset/home.webp', '/skins/sunset_bg.webp', NULL, 'pill', '#FF6B6B', '#FFB347', 'gradient-blobs', true, true, 0,
             '{"home": "/skins/sunset/home.webp", "search": "/skins/sunset/search.webp", "library": "/skins/sunset/library.webp", "album": "/skins/sunset/album.webp"}'::jsonb, NULL),
            
            ('Броня гения', 'Красно-золотой tech HUD', '/skins/irontech/home.webp', '/skins/irontech_bg.webp', NULL, 'square', '#C41E3A', '#FFD700', 'particles', true, true, 0,
             '{"home": "/skins/irontech/home.webp", "search": "/skins/irontech/search.webp", "library": "/skins/irontech/library.webp", "album": "/skins/irontech/album.webp"}'::jsonb, NULL),
            
            ('Ночной паутинщик', 'Красно-синий городской пейзаж', '/skins/spider/home.webp', '/skins/spider_bg.webp', NULL, 'outline', '#8B0000', '#4682B4', 'gradient-blobs', true, true, 0,
             '{"home": "/skins/spider/home.webp", "search": "/skins/spider/search.webp", "library": "/skins/spider/library.webp", "album": "/skins/spider/album.webp"}'::jsonb, NULL),
            
            ('Бейкер-стрит', 'Викторианский детектив', '/skins/baker/home.webp', '/skins/baker_bg.webp', NULL, 'round', '#FFBF00', '#8B4513', 'none', true, true, 0,
             '{"home": "/skins/baker/home.webp", "search": "/skins/baker/search.webp", "library": "/skins/baker/library.webp", "album": "/skins/baker/album.webp"}'::jsonb, NULL),
            
            ('Викинги', 'Северные фьорды и драккары', '/skins/vikings/home.webp', '/skins/vikings_bg.webp', NULL, 'square', '#4682B4', '#708090', 'waveform', true, true, 0,
             '{"home": "/skins/vikings/home.webp", "search": "/skins/vikings/search.webp", "library": "/skins/vikings/library.webp", "album": "/skins/vikings/album.webp"}'::jsonb, NULL),
            
            ('Железный трон', 'Средневековый замок', '/skins/thrones/home.webp', '/skins/thrones_bg.webp', NULL, 'minimal', '#2C2C2C', '#8B0000', 'particles', true, true, 0,
             '{"home": "/skins/thrones/home.webp", "search": "/skins/thrones/search.webp", "library": "/skins/thrones/library.webp", "album": "/skins/thrones/album.webp"}'::jsonb, NULL),
            
            ('Звёздный флот', 'Исследование далёких галактик', '/skins/starfleet/home.webp', '/skins/starfleet_bg.webp', NULL, 'pill', '#4169E1', '#1E90FF', 'particles', true, true, 0,
             '{"home": "/skins/starfleet/home.webp", "search": "/skins/starfleet/search.webp", "library": "/skins/starfleet/library.webp", "album": "/skins/starfleet/album.webp"}'::jsonb, NULL),
            
            ('Менталист', 'Тёплый минимализм с чайным настроением', '/skins/mentalist/home.webp', '/skins/mentalist_bg.webp', NULL, 'minimal', '#D4A76A', '#8B7355', 'none', true, true, 0,
             '{"home": "/skins/mentalist/home.webp", "search": "/skins/mentalist/search.webp", "library": "/skins/mentalist/library.webp", "album": "/skins/mentalist/album.webp"}'::jsonb, NULL),
            
            ('Косплей', 'Яркие цвета аниме-конвенций', '/skins/cosplay/home.webp', '/skins/cosplay_bg.webp', NULL, 'round', '#FF1493', '#00CED1', 'gradient-blobs', true, true, 0,
             '{"home": "/skins/cosplay/home.webp", "search": "/skins/cosplay/search.webp", "library": "/skins/cosplay/library.webp", "album": "/skins/cosplay/album.webp"}'::jsonb, NULL)
        
        ON CONFLICT (name) WHERE is_preset = true DO UPDATE SET
            description = EXCLUDED.description,
            banner_url = EXCLUDED.banner_url,
            background_url = EXCLUDED.background_url,
            button_style = EXCLUDED.button_style,
            accent_color = EXCLUDED.accent_color,
            accent_secondary = EXCLUDED.accent_secondary,
            animation_type = EXCLUDED.animation_type,
            banners = EXCLUDED.banners,
            updated_at = now()
    """)


def downgrade() -> None:
    op.drop_column('skins', 'banners')
