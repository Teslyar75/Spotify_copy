#!/usr/bin/env python3
"""Создаёт placeholder изображения для документации"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

DOCS_DIR = Path(__file__).parent.parent / "docs" / "screenshots"
DOCS_DIR.mkdir(parents=True, exist_ok=True)

def create_placeholder(filename, width, height, text):
    img = Image.new('RGB', (width, height), color='#121212')
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (width - (bbox[2] - bbox[0])) // 2
    y = (height - (bbox[3] - bbox[1])) // 2
    draw.text((x, y), text, fill='white', font=font)
    draw.rectangle([0, 0, width-1, height-1], outline='#1DB954', width=3)
    img.save(DOCS_DIR / filename, 'PNG')
    print(f"Created {filename}")

screenshots = [
    ("mobile-skins-page.png", 390, 844, "Skins Page (Mobile)"),
    ("desktop-skins-page.png", 1920, 1080, "Skins Page (Desktop)"),
    ("mobile-default-home.png", 390, 844, "Default - Home"),
    ("desktop-default-home.png", 1920, 1080, "Default - Home"),
    ("mobile-default-player.png", 390, 844, "Default - Player"),
    ("mobile-vikings-home.png", 390, 844, "Vikings - Home"),
    ("mobile-thrones-home.png", 390, 844, "Thrones - Home"),
    ("mobile-photo-upload.png", 390, 844, "Photo Upload"),
    ("mobile-jamendo-default.png", 390, 844, "Jamendo - Default"),
    ("mobile-jamendo-vikings.png", 390, 844, "Jamendo - Vikings"),
]

for f, w, h, t in screenshots:
    create_placeholder(f, w, h, t)
print(f"Done! Created {len(screenshots)} placeholders in {DOCS_DIR}")
