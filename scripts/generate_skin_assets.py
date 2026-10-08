#!/usr/bin/env python3
"""
Генератор оригинальных изображений для скинов LobStars.
Создаёт WebP banner (1200x400) и background (800x800) с градиентами и паттернами.
"""
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import random
import math

OUTPUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "skins"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def create_gradient(width: int, height: int, color1: tuple, color2: tuple, vertical: bool = False) -> Image.Image:
    """Создать градиентное изображение"""
    img = Image.new('RGB', (width, height), color1)
    draw = ImageDraw.Draw(img)
    
    for i in range(height if vertical else width):
        ratio = i / (height if vertical else width)
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        
        if vertical:
            draw.line([(0, i), (width, i)], fill=(r, g, b))
        else:
            draw.line([(i, 0), (i, height)], fill=(r, g, b))
    
    return img

def hex_to_rgb(hex_color: str) -> tuple:
    """Конвертировать HEX в RGB"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def add_stars(img: Image.Image, count: int = 100):
    """Добавить звёзды для космических тем"""
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    for _ in range(count):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(1, 3)
        brightness = random.randint(150, 255)
        draw.ellipse([x-size, y-size, x+size, y+size], fill=(brightness, brightness, brightness))

def add_grid(img: Image.Image, spacing: int = 50, color: tuple = (255, 255, 255, 30)):
    """Добавить сетку для tech тем"""
    draw = ImageDraw.Draw(img, 'RGBA')
    width, height = img.size
    
    for x in range(0, width, spacing):
        draw.line([(x, 0), (x, height)], fill=color, width=1)
    for y in range(0, height, spacing):
        draw.line([(0, y), (width, y)], fill=color, width=1)

def add_waves(img: Image.Image, color: tuple = (255, 255, 255, 50)):
    """Добавить волны для водных/синтвейв тем"""
    draw = ImageDraw.Draw(img, 'RGBA')
    width, height = img.size
    
    for wave_y in range(0, height, 60):
        points = []
        for x in range(0, width + 10, 10):
            y = wave_y + int(20 * math.sin(x / 50))
            points.append((x, y))
        draw.line(points, fill=color, width=2)

def add_circles(img: Image.Image, count: int = 20, color: tuple = (255, 255, 255, 30)):
    """Добавить круги для минималистичных тем"""
    draw = ImageDraw.Draw(img, 'RGBA')
    width, height = img.size
    
    for _ in range(count):
        x = random.randint(-50, width + 50)
        y = random.randint(-50, height + 50)
        radius = random.randint(30, 150)
        draw.ellipse([x-radius, y-radius, x+radius, y+radius], outline=color, width=2)

# Конфигурация скинов
SKINS_CONFIG = [
    {
        "name": "minimalism",
        "colors": ["#F5F5F5", "#E0E0E0"],
        "pattern": "circles"
    },
    {
        "name": "cosmos",
        "colors": ["#1a1a2e", "#16213e"],
        "pattern": "stars"
    },
    {
        "name": "sunset",
        "colors": ["#FF6B6B", "#FFB347"],
        "pattern": None
    },
    {
        "name": "irontech",
        "colors": ["#1a0000", "#3d0000"],
        "pattern": "grid"
    },
    {
        "name": "spider",
        "colors": ["#1a0000", "#001a3d"],
        "pattern": "grid"
    },
    {
        "name": "baker",
        "colors": ["#2F2416", "#4A3B2A"],
        "pattern": "circles"
    },
    {
        "name": "vikings",
        "colors": ["#1e3a5f", "#2c5f8d"],
        "pattern": "waves"
    },
    {
        "name": "thrones",
        "colors": ["#1a1a1a", "#2d2d2d"],
        "pattern": "grid"
    },
    {
        "name": "starfleet",
        "colors": ["#000033", "#001a66"],
        "pattern": "stars"
    },
    {
        "name": "mentalist",
        "colors": ["#3d3530", "#6b5d52"],
        "pattern": "circles"
    },
    {
        "name": "cosplay",
        "colors": ["#FF1493", "#00CED1"],
        "pattern": None
    },
]

def generate_skin_images(config: dict):
    """Генерировать banner и background для скина"""
    name = config["name"]
    color1 = hex_to_rgb(config["colors"][0])
    color2 = hex_to_rgb(config["colors"][1])
    pattern = config.get("pattern")
    
    # Banner 1200x400
    print(f"Generating {name}_banner.webp...")
    banner = create_gradient(1200, 400, color1, color2, vertical=True)
    
    if pattern == "stars":
        add_stars(banner, count=150)
    elif pattern == "grid":
        add_grid(banner, spacing=40)
    elif pattern == "waves":
        add_waves(banner)
    elif pattern == "circles":
        add_circles(banner, count=15)
    
    banner = banner.filter(ImageFilter.GaussianBlur(radius=1))
    banner.save(OUTPUT_DIR / f"{name}_banner.webp", "WEBP", quality=85)
    
    # Background 800x800
    print(f"Generating {name}_bg.webp...")
    bg = create_gradient(800, 800, color1, color2, vertical=False)
    
    if pattern == "stars":
        add_stars(bg, count=200)
    elif pattern == "grid":
        add_grid(bg, spacing=50)
    elif pattern == "waves":
        add_waves(bg)
    elif pattern == "circles":
        add_circles(bg, count=25)
    
    bg = bg.filter(ImageFilter.GaussianBlur(radius=2))
    bg.save(OUTPUT_DIR / f"{name}_bg.webp", "WEBP", quality=85)

if __name__ == "__main__":
    print("Generating skin assets...")
    for skin in SKINS_CONFIG:
        generate_skin_images(skin)
    print(f"Done! Assets saved to {OUTPUT_DIR}")
