#!/usr/bin/env python3
"""
Generate 4 distinct bright high-contrast themed banners per skin (home, search, library, album).
Output: 60 WebP files (15 skins × 4 pages) under frontend/public/skins/<slug>/
Each banner must be clearly visible under dark gradient overlay — avoid near-black fills.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import random
import math

WIDTH = 1200
HEIGHT = 400
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../frontend/public/skins')

def interpolate_color(c1, c2, t):
    """Linear interpolation between two colors."""
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def create_gradient(draw, colors, width=WIDTH, height=HEIGHT, angle=45):
    """Create a multi-color gradient at specified angle."""
    steps = height
    for i in range(steps):
        t = i / steps
        if len(colors) == 2:
            color = interpolate_color(colors[0], colors[1], t)
        else:
            # Multi-color gradient
            segment = int(t * (len(colors) - 1))
            segment = min(segment, len(colors) - 2)
            local_t = (t * (len(colors) - 1)) - segment
            color = interpolate_color(colors[segment], colors[segment + 1], local_t)
        draw.rectangle([(0, i), (width, i + 1)], fill=color)

def add_geometric_pattern(draw, colors, pattern_type='circles'):
    """Add geometric patterns for visual interest."""
    if pattern_type == 'circles':
        for _ in range(12):
            x = random.randint(0, WIDTH)
            y = random.randint(0, HEIGHT)
            r = random.randint(40, 150)
            color = random.choice(colors)
            alpha_color = (*color, 60)  # Semi-transparent
            draw.ellipse([x-r, y-r, x+r, y+r], fill=alpha_color)
    elif pattern_type == 'triangles':
        for _ in range(10):
            x = random.randint(0, WIDTH)
            y = random.randint(0, HEIGHT)
            size = random.randint(60, 180)
            color = (*random.choice(colors), 80)
            points = [
                (x, y - size),
                (x - size, y + size),
                (x + size, y + size)
            ]
            draw.polygon(points, fill=color)
    elif pattern_type == 'hexagons':
        for _ in range(8):
            cx = random.randint(0, WIDTH)
            cy = random.randint(0, HEIGHT)
            size = random.randint(50, 120)
            color = (*random.choice(colors), 70)
            points = []
            for i in range(6):
                angle = i * math.pi / 3
                x = cx + size * math.cos(angle)
                y = cy + size * math.sin(angle)
                points.append((x, y))
            draw.polygon(points, fill=color)

def add_text_overlay(draw, text, font_size=80, color=(255, 255, 255, 255)):
    """Add large visible text overlay."""
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (WIDTH - text_width) // 2
    y = (HEIGHT - text_height) // 2
    
    # Shadow for depth
    shadow_offset = 4
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0, 0, 0, 180))
    draw.text((x, y), text, font=font, fill=color)

def create_starfield(draw, num_stars=200, colors=[(255, 255, 255)]):
    """Create a starfield effect."""
    for _ in range(num_stars):
        x = random.randint(0, WIDTH)
        y = random.randint(0, HEIGHT)
        size = random.choice([1, 2, 3, 4])
        brightness = random.randint(180, 255)
        color = random.choice(colors)
        color_with_brightness = tuple(min(255, c + brightness - 200) for c in color)
        draw.ellipse([x, y, x+size, y+size], fill=color_with_brightness)

def create_waves(draw, colors, amplitude=60, frequency=3):
    """Create wave patterns."""
    for wave_idx in range(frequency):
        y_offset = wave_idx * (HEIGHT // frequency)
        for x in range(WIDTH):
            y = y_offset + int(amplitude * math.sin(x * 0.02))
            color = interpolate_color(colors[0], colors[1], wave_idx / frequency)
            alpha_color = (*color, 100)
            draw.ellipse([x, y, x+6, y+6], fill=alpha_color)

# Theme definitions with distinct visuals per page
THEMES = {
    'standard': {
        'home': (['#2D3E50', '#3E5770', '#5A7A9B'], 'circles', 'Standard Home'),
        'search': (['#34495E', '#5D6D7E', '#85929E'], 'triangles', 'Search'),
        'library': (['#1C2833', '#34495E', '#566573'], 'hexagons', 'Library'),
        'album': (['#212F3D', '#2E4053', '#5D6D7E'], 'circles', 'Album')
    },
    'spotify': {
        'home': (['#1DB954', '#1ed760', '#22FF66'], 'waves', 'Spotify Home'),
        'search': (['#169146', '#1DB954', '#25DD5F'], 'circles', 'Search'),
        'library': (['#138A3E', '#169146', '#1DB954'], 'triangles', 'Your Library'),
        'album': (['#0E6F32', '#138A3E', '#169146'], 'hexagons', 'Album')
    },
    'neon': {
        'home': (['#00FFFF', '#FF00FF', '#FFFF00'], 'circles', 'NEON HOME'),
        'search': (['#FF00FF', '#00FFFF', '#00FF00'], 'triangles', 'SEARCH'),
        'library': (['#FFFF00', '#00FFFF', '#FF00FF'], 'hexagons', 'LIBRARY'),
        'album': (['#00FF00', '#FF00FF', '#00FFFF'], 'circles', 'ALBUM')
    },
    'retro': {
        'home': (['#FF6EC7', '#7B2CBF', '#FF1F7D'], 'waves', 'RETRO HOME'),
        'search': (['#FF007F', '#FF6EC7', '#FF1F7D'], 'circles', 'SEARCH'),
        'library': (['#C400FF', '#7B2CBF', '#FF00BF'], 'triangles', 'LIBRARY'),
        'album': (['#8000FF', '#C400FF', '#FF00BF'], 'hexagons', 'ALBUM')
    },
    'minimalism': {
        'home': (['#FFFFFF', '#F5F5F5', '#E0E0E0'], 'circles', 'Minimal Home'),
        'search': (['#F9F9F9', '#EEEEEE', '#E0E0E0'], 'triangles', 'Search'),
        'library': (['#F0F0F0', '#E5E5E5', '#D8D8D8'], 'hexagons', 'Library'),
        'album': (['#E8E8E8', '#DDDDDD', '#D0D0D0'], 'circles', 'Album')
    },
    'cosmos': {
        'home': (['#1E0A3C', '#8B5CF6', '#A78BFA'], 'stars', 'Cosmos Home'),
        'search': (['#2D1B69', '#8B5CF6', '#A78BFA'], 'stars', 'Deep Search'),
        'library': (['#3B2C6B', '#8B5CF6', '#C084FC'], 'stars', 'Star Library'),
        'album': (['#4A1D96', '#7C3AED', '#A78BFA'], 'stars', 'Nebula')
    },
    'sunset': {
        'home': (['#FF6B6B', '#FFB347', '#FFA500'], 'waves', 'Sunset Home'),
        'search': (['#FF7F50', '#FF6B6B', '#FFB347'], 'circles', 'Golden Search'),
        'library': (['#FFA500', '#FF8C00', '#FF7F50'], 'triangles', 'Warm Library'),
        'album': (['#FF6347', '#FF7F50', '#FF8C00'], 'hexagons', 'Fire Album')
    },
    'irontech': {
        'home': (['#C41E3A', '#FFD700', '#FFA500'], 'hexagons', 'IRON HOME'),
        'search': (['#B22222', '#FFD700', '#FF8C00'], 'circles', 'TECH SEARCH'),
        'library': (['#8B0000', '#FFD700', '#FFA500'], 'triangles', 'GOLD LIB'),
        'album': (['#A52A2A', '#FFD700', '#FF8C00'], 'hexagons', 'POWER')
    },
    'spider': {
        'home': (['#8B0000', '#4682B4', '#1E90FF'], 'circles', 'SPIDER HOME'),
        'search': (['#DC143C', '#4682B4', '#1E90FF'], 'triangles', 'WEB SEARCH'),
        'library': (['#B22222', '#4169E1', '#00BFFF'], 'hexagons', 'CITY LIB'),
        'album': (['#A52A2A', '#4682B4', '#1E90FF'], 'circles', 'NIGHT')
    },
    'baker': {
        'home': (['#FFBF00', '#8B4513', '#D2691E'], 'circles', 'Baker Street'),
        'search': (['#FFD700', '#A0522D', '#CD853F'], 'triangles', 'Mystery Search'),
        'library': (['#FFA500', '#8B4513', '#BC8F8F'], 'hexagons', 'Library 221B'),
        'album': (['#DAA520', '#8B4513', '#D2691E'], 'circles', 'Case Files')
    },
    'vikings': {
        'home': (['#4682B4', '#87CEEB', '#B0C4DE'], 'waves', 'VIKING HOME'),
        'search': (['#5F9EA0', '#87CEEB', '#ADD8E6'], 'circles', 'FJORD SEARCH'),
        'library': (['#6495ED', '#7B68EE', '#9370DB'], 'triangles', 'SAGA LIB'),
        'album': (['#4169E1', '#6495ED', '#87CEEB'], 'hexagons', 'SHIP')
    },
    'thrones': {
        'home': (['#8B0000', '#DC143C', '#FF6347'], 'hexagons', 'THRONE HOME'),
        'search': (['#A52A2A', '#DC143C', '#FF4500'], 'circles', 'REALM SEARCH'),
        'library': (['#B22222', '#CD5C5C', '#F08080'], 'triangles', 'CASTLE LIB'),
        'album': (['#8B0000', '#B22222', '#CD5C5C'], 'hexagons', 'KINGDOM')
    },
    'starfleet': {
        'home': (['#4169E1', '#1E90FF', '#00BFFF'], 'stars', 'Starfleet HQ'),
        'search': (['#1E90FF', '#00BFFF', '#87CEEB'], 'stars', 'Scan Sector'),
        'library': (['#0000CD', '#4169E1', '#1E90FF'], 'stars', 'Archive'),
        'album': (['#000080', '#0000CD', '#4169E1'], 'stars', 'Mission Log')
    },
    'mentalist': {
        'home': (['#D4A76A', '#8B7355', '#BC8F8F'], 'circles', 'Tea Home'),
        'search': (['#C19A6B', '#8B7355', '#A0826D'], 'triangles', 'Mind Search'),
        'library': (['#D2B48C', '#8B7355', '#BC8F8F'], 'hexagons', 'Memory Lib'),
        'album': (['#C9A87C', '#8B7355', '#A0826D'], 'circles', 'Case Album')
    },
    'cosplay': {
        'home': (['#FF1493', '#00CED1', '#FFD700'], 'circles', 'COSPLAY HOME'),
        'search': (['#FF00FF', '#00FFFF', '#FFFF00'], 'triangles', 'CON SEARCH'),
        'library': (['#FF69B4', '#40E0D0', '#FFA500'], 'hexagons', 'COSTUME LIB'),
        'album': (['#FF1493', '#00CED1', '#FFD700'], 'circles', 'PHOTO ALBUM')
    }
}

def generate_banner(slug, page, theme_data):
    """Generate one bright high-contrast banner."""
    colors_hex, pattern, text = theme_data
    colors = [tuple(int(h[i:i+2], 16) for i in (1, 3, 5)) for h in colors_hex]
    
    img = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, 'RGBA')
    
    # Base gradient
    create_gradient(draw, colors)
    
    # Pattern overlay
    if pattern == 'stars':
        create_starfield(draw, num_stars=250, colors=colors)
    elif pattern == 'waves':
        create_waves(draw, colors, amplitude=70, frequency=4)
    else:
        add_geometric_pattern(draw, colors, pattern_type=pattern)
    
    # Text overlay (optional, remove if too cluttered)
    # add_text_overlay(draw, text, font_size=70, color=(255, 255, 255, 230))
    
    # Apply slight blur for depth
    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    
    # Save
    output_path = os.path.join(OUTPUT_DIR, slug, f'{page}.webp')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, 'WEBP', quality=85)
    print(f'✓ {output_path}')

def main():
    """Generate all 60 banners (15 skins × 4 pages)."""
    for slug, pages in THEMES.items():
        for page in ['home', 'search', 'library', 'album']:
            generate_banner(slug, page, pages[page])
    print(f'\n✓ Generated 60 bright high-contrast banners in {OUTPUT_DIR}')

if __name__ == '__main__':
    main()
