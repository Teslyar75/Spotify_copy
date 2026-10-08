#!/usr/bin/env python3
"""
Генератор 4 уникальных баннеров для каждого скина (home, search, library, album).
Каждый баннер - визуально отличная сцена в рамках темы скина.
"""
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import random
import math

OUTPUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "skins"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def hex_to_rgb(hex_color: str) -> tuple:
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_gradient(width: int, height: int, color1: tuple, color2: tuple, vertical: bool = False, diagonal: bool = False) -> Image.Image:
    img = Image.new('RGB', (width, height), color1)
    draw = ImageDraw.Draw(img)
    
    if diagonal:
        for i in range(width + height):
            ratio = i / (width + height)
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(i, 0), (0, i)], fill=(r, g, b), width=2)
    elif vertical:
        for i in range(height):
            ratio = i / height
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(0, i), (width, i)], fill=(r, g, b))
    else:
        for i in range(width):
            ratio = i / width
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(i, 0), (i, height)], fill=(r, g, b))
    
    return img

def add_stars(img: Image.Image, count: int = 100, brightness_range=(150, 255)):
    draw = ImageDraw.Draw(img)
    width, height = img.size
    for _ in range(count):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(1, 3)
        brightness = random.randint(*brightness_range)
        draw.ellipse([x-size, y-size, x+size, y+size], fill=(brightness, brightness, brightness))

def add_geometric_pattern(img: Image.Image, pattern_type: str, color: tuple = (255, 255, 255, 30)):
    draw = ImageDraw.Draw(img, 'RGBA')
    width, height = img.size
    
    if pattern_type == "grid":
        for x in range(0, width, 50):
            draw.line([(x, 0), (x, height)], fill=color, width=1)
        for y in range(0, height, 50):
            draw.line([(0, y), (width, y)], fill=color, width=1)
    
    elif pattern_type == "hexagons":
        hex_size = 40
        for row in range(-1, height // hex_size + 2):
            for col in range(-1, width // hex_size + 2):
                x = col * hex_size * 1.5
                y = row * hex_size * math.sqrt(3)
                if col % 2:
                    y += hex_size * math.sqrt(3) / 2
                points = []
                for i in range(6):
                    angle = math.pi / 3 * i
                    px = x + hex_size * math.cos(angle)
                    py = y + hex_size * math.sin(angle)
                    points.append((int(px), int(py)))
                draw.polygon(points, outline=color)
    
    elif pattern_type == "waves":
        for wave_y in range(0, height, 60):
            points = []
            for x in range(0, width + 10, 10):
                y = wave_y + int(20 * math.sin(x / 50))
                points.append((x, y))
            draw.line(points, fill=color, width=2)
    
    elif pattern_type == "circles":
        for _ in range(30):
            x = random.randint(-50, width + 50)
            y = random.randint(-50, height + 50)
            radius = random.randint(30, 150)
            draw.ellipse([x-radius, y-radius, x+radius, y+radius], outline=color, width=2)
    
    elif pattern_type == "triangles":
        for _ in range(20):
            x = random.randint(0, width)
            y = random.randint(0, height)
            size = random.randint(30, 80)
            points = [(x, y-size), (x-size, y+size), (x+size, y+size)]
            draw.polygon(points, outline=color, width=2)

# Конфигурация скинов с 4 разными сценами для каждого
SKINS_CONFIG = {
    "standard": {
        "colors": ["#2a2a2a", "#3a3a3a"],
        "scenes": [
            ("home", "circles", False),
            ("search", "grid", False),
            ("library", "waves", False),
            ("album", "hexagons", False),
        ]
    },
    "spotify": {
        "colors": ["#1a1a1a", "#2a2a2a"],
        "scenes": [
            ("home", "waves", False),
            ("search", "circles", False),
            ("library", "grid", False),
            ("album", "triangles", False),
        ]
    },
    "neon": {
        "colors": ["#0a0a1a", "#1a0a2a"],
        "scenes": [
            ("home", "grid", True),
            ("search", "hexagons", True),
            ("library", "waves", True),
            ("album", "circles", True),
        ]
    },
    "retro": {
        "colors": ["#2a0a3a", "#4a1a5a"],
        "scenes": [
            ("home", "waves", True),
            ("search", "circles", True),
            ("library", "triangles", True),
            ("album", "grid", True),
        ]
    },
    "minimalism": {
        "colors": ["#F5F5F5", "#E0E0E0"],
        "scenes": [
            ("home", "circles", False),
            ("search", None, False),
            ("library", "waves", False),
            ("album", "triangles", False),
        ]
    },
    "cosmos": {
        "colors": ["#0a0a1a", "#16213e"],
        "scenes": [
            ("home", "stars", False),
            ("search", "stars", False),
            ("library", "stars", False),
            ("album", "stars", False),
        ]
    },
    "sunset": {
        "colors": ["#FF6B6B", "#FFB347"],
        "scenes": [
            ("home", "circles", True),
            ("search", "waves", True),
            ("library", None, False),
            ("album", "triangles", True),
        ]
    },
    "irontech": {
        "colors": ["#1a0000", "#3d0000"],
        "scenes": [
            ("home", "hexagons", True),
            ("search", "grid", True),
            ("library", "triangles", True),
            ("album", "circles", True),
        ]
    },
    "spider": {
        "colors": ["#1a0000", "#001a3d"],
        "scenes": [
            ("home", "grid", True),
            ("search", "hexagons", True),
            ("library", "waves", True),
            ("album", "triangles", True),
        ]
    },
    "baker": {
        "colors": ["#2F2416", "#4A3B2A"],
        "scenes": [
            ("home", "circles", False),
            ("search", "waves", False),
            ("library", "grid", False),
            ("album", "hexagons", False),
        ]
    },
    "vikings": {
        "colors": ["#1e3a5f", "#2c5f8d"],
        "scenes": [
            ("home", "waves", True),  # Драккары на волнах
            ("search", "circles", True),  # Фьорды
            ("library", "triangles", True),  # Горы Норвегии
            ("album", "grid", True),  # Руны и щиты
        ]
    },
    "thrones": {
        "colors": ["#1a1a1a", "#2d2d2d"],
        "scenes": [
            ("home", "grid", True),  # Замок
            ("search", "hexagons", True),  # Трон
            ("library", "triangles", True),  # Мечи
            ("album", "waves", True),  # Драконы силуэты
        ]
    },
    "starfleet": {
        "colors": ["#000033", "#001a66"],
        "scenes": [
            ("home", "stars", True),
            ("search", "hexagons", True),
            ("library", "grid", True),
            ("album", "circles", True),
        ]
    },
    "mentalist": {
        "colors": ["#3d3530", "#6b5d52"],
        "scenes": [
            ("home", "circles", False),
            ("search", "waves", False),
            ("library", None, False),
            ("album", "triangles", False),
        ]
    },
    "cosplay": {
        "colors": ["#FF1493", "#00CED1"],
        "scenes": [
            ("home", "circles", True),
            ("search", "hexagons", True),
            ("library", "triangles", True),
            ("album", "stars", True),
        ]
    },
}

def generate_skin_banners(name: str, config: dict):
    """Генерировать 4 баннера для скина"""
    skin_dir = OUTPUT_DIR / name
    skin_dir.mkdir(parents=True, exist_ok=True)
    
    color1 = hex_to_rgb(config["colors"][0])
    color2 = hex_to_rgb(config["colors"][1])
    
    for page, pattern, add_glow in config["scenes"]:
        print(f"Generating {name}/{page}.webp...")
        
        # Создаём уникальный градиент для каждой страницы
        if page == "home":
            img = create_gradient(1200, 400, color1, color2, vertical=True)
        elif page == "search":
            img = create_gradient(1200, 400, color1, color2, vertical=False)
        elif page == "library":
            img = create_gradient(1200, 400, color1, color2, diagonal=True)
        else:  # album
            img = create_gradient(1200, 400, color2, color1, vertical=True)
        
        # Добавляем паттерн
        if pattern == "stars":
            add_stars(img, count=200 if add_glow else 150)
        elif pattern:
            add_geometric_pattern(img, pattern)
        
        # Добавляем лёгкий blur для софт-эффекта
        img = img.filter(ImageFilter.GaussianBlur(radius=1 if add_glow else 0.5))
        
        img.save(skin_dir / f"{page}.webp", "WEBP", quality=85)

if __name__ == "__main__":
    print("Generating multi-page skin banners...")
    for skin_name, config in SKINS_CONFIG.items():
        generate_skin_banners(skin_name, config)
    print(f"\nDone! Generated {len(SKINS_CONFIG) * 4} banners in {OUTPUT_DIR}")
