#!/usr/bin/env python3
"""Генератор 4 уникальных баннеров для каждого скина"""
import os, random, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "skins"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def create_gradient(w, h, c1, c2, mode=0):
    img = Image.new('RGB', (w, h), c1)
    draw = ImageDraw.Draw(img)
    steps = h if mode == 1 else w
    for i in range(steps):
        r = i / steps
        col = tuple(int(c1[j] * (1-r) + c2[j] * r) for j in range(3))
        if mode == 1:
            draw.line([(0, i), (w, i)], fill=col)
        else:
            draw.line([(i, 0), (i, h)], fill=col)
    return img

def add_pattern(img, pat):
    draw = ImageDraw.Draw(img, 'RGBA')
    w, h = img.size
    col = (255, 255, 255, 30)
    if pat == "grid":
        for x in range(0, w, 50): draw.line([(x, 0), (x, h)], fill=col, width=1)
        for y in range(0, h, 50): draw.line([(0, y), (w, y)], fill=col, width=1)
    elif pat == "stars":
        for _ in range(150):
            x, y = random.randint(0, w), random.randint(0, h)
            s, b = random.randint(1, 3), random.randint(150, 255)
            draw.ellipse([x-s, y-s, x+s, y+s], fill=(b, b, b))
    elif pat == "waves":
        for wy in range(0, h, 60):
            pts = [(x, wy + int(20 * math.sin(x / 50))) for x in range(0, w+10, 10)]
            draw.line(pts, fill=col, width=2)

SKINS = {
    "standard": (["#2a2a2a", "#3a3a3a"], ["grid", None, "waves", "grid"]),
    "spotify": (["#1a1a1a", "#2a2a2a"], ["waves", "grid", None, "waves"]),
    "neon": (["#0a0a1a", "#1a0a2a"], ["grid", "waves", "grid", "waves"]),
    "retro": (["#2a0a3a", "#4a1a5a"], ["waves", "grid", "waves", "grid"]),
    "minimalism": (["#F5F5F5", "#E0E0E0"], [None, None, "waves", None]),
    "cosmos": (["#0a0a1a", "#16213e"], ["stars", "stars", "stars", "stars"]),
    "sunset": (["#FF6B6B", "#FFB347"], ["waves", None, "waves", None]),
    "irontech": (["#1a0000", "#3d0000"], ["grid", "grid", "waves", "grid"]),
    "spider": (["#1a0000", "#001a3d"], ["grid", "waves", "grid", "waves"]),
    "baker": (["#2F2416", "#4A3B2A"], [None, "waves", "grid", None]),
    "vikings": (["#1e3a5f", "#2c5f8d"], ["waves", "grid", "waves", "grid"]),
    "thrones": (["#1a1a1a", "#2d2d2d"], ["grid", "waves", "grid", "waves"]),
    "starfleet": (["#000033", "#001a66"], ["stars", "grid", "stars", "grid"]),
    "mentalist": (["#3d3530", "#6b5d52"], [None, "waves", None, "waves"]),
    "cosplay": (["#FF1493", "#00CED1"], ["waves", "grid", "waves", "stars"]),
}

pages = ["home", "search", "library", "album"]
for name, (cols, pats) in SKINS.items():
    d = OUTPUT_DIR / name
    d.mkdir(parents=True, exist_ok=True)
    c1, c2 = hex_to_rgb(cols[0]), hex_to_rgb(cols[1])
    for i, pg in enumerate(pages):
        print(f"{name}/{pg}.webp")
        img = create_gradient(1200, 400, c1, c2, i % 2)
        if pats[i]: add_pattern(img, pats[i])
        img = img.filter(ImageFilter.GaussianBlur(radius=1))
        img.save(d / f"{pg}.webp", "WEBP", quality=85)
print("Done!")
