"""Создаёт .ico файл из PNG для ярлыка Windows."""
from pathlib import Path

from PIL import Image

src = Path(__file__).parent / "spotify-clone.png"
if not src.exists():
    print("PNG иконка не найдена")
    exit(1)

img = Image.open(src).convert("RGBA")
out = Path(__file__).parent / "spotify-clone-icon.ico"

# ICO требует несколько размеров для Windows
sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
img.save(out, format="ICO", sizes=sizes)
print("Создан:", out)
