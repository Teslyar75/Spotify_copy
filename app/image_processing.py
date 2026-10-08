"""
Обработка изображений для скинов.

Функции:
- Изменение размера и обрезка
- Исправление EXIF-ориентации (фото с телефона часто повёрнуты)
- Извлечение доминантного цвета
- Конвертация в WebP/JPEG с оптимизацией
"""

import io
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image, ImageOps
from collections import Counter


def fix_exif_orientation(img: Image.Image) -> Image.Image:
    """
    Исправляет ориентацию изображения согласно EXIF-данным.
    Многие телефоны сохраняют фото в одной ориентации, но с EXIF-флагом поворота.
    """
    try:
        return ImageOps.exif_transpose(img)
    except Exception:
        return img


def get_dominant_color(img: Image.Image, palette_size: int = 16) -> str:
    """
    Извлекает доминантный цвет из изображения.
    
    Алгоритм:
    1. Уменьшаем изображение для ускорения
    2. Квантизируем палитру до palette_size цветов
    3. Находим самый частый цвет
    4. Возвращаем в формате hex (#RRGGBB)
    """
    # Уменьшаем для ускорения (150x150 достаточно)
    img_small = img.copy()
    img_small.thumbnail((150, 150), Image.Resampling.LANCZOS)
    
    # Конвертируем в RGB если нужно
    if img_small.mode != 'RGB':
        img_small = img_small.convert('RGB')
    
    # Квантизируем палитру (уменьшаем количество уникальных цветов)
    paletted = img_small.convert('P', palette=Image.Palette.ADAPTIVE, colors=palette_size)
    
    # Считаем частоту каждого цвета
    palette = paletted.getpalette()
    color_counts = Counter(paletted.getdata())
    
    # Находим самый частый цвет
    most_common_index = color_counts.most_common(1)[0][0]
    
    # Получаем RGB из палитры
    r = palette[most_common_index * 3]
    g = palette[most_common_index * 3 + 1]
    b = palette[most_common_index * 3 + 2]
    
    return f"#{r:02x}{g:02x}{b:02x}"


def get_secondary_color(img: Image.Image, dominant_color: str, palette_size: int = 16) -> str:
    """
    Извлекает вторичный акцентный цвет (второй по частоте, отличающийся от доминантного).
    """
    img_small = img.copy()
    img_small.thumbnail((150, 150), Image.Resampling.LANCZOS)
    
    if img_small.mode != 'RGB':
        img_small = img_small.convert('RGB')
    
    paletted = img_small.convert('P', palette=Image.Palette.ADAPTIVE, colors=palette_size)
    palette = paletted.getpalette()
    color_counts = Counter(paletted.getdata())
    
    # Берём топ-5 цветов и находим тот, который достаточно отличается от доминантного
    dominant_rgb = tuple(int(dominant_color[i:i+2], 16) for i in (1, 3, 5))
    
    for index, count in color_counts.most_common(5):
        r = palette[index * 3]
        g = palette[index * 3 + 1]
        b = palette[index * 3 + 2]
        
        # Проверяем что цвет достаточно отличается (евклидово расстояние > 100)
        distance = ((r - dominant_rgb[0])**2 + (g - dominant_rgb[1])**2 + (b - dominant_rgb[2])**2) ** 0.5
        
        if distance > 100:
            return f"#{r:02x}{g:02x}{b:02x}"
    
    # Если не нашли подходящий — возвращаем осветлённый вариант доминантного
    r, g, b = dominant_rgb
    factor = 1.3
    r = min(255, int(r * factor))
    g = min(255, int(g * factor))
    b = min(255, int(b * factor))
    return f"#{r:02x}{g:02x}{b:02x}"


def resize_and_crop_image(
    image_data: bytes,
    target_width: int,
    target_height: int,
    quality: int = 85,
    output_format: str = "WEBP"
) -> Tuple[bytes, str]:
    """
    Изменяет размер и обрезает изображение до целевого размера.
    
    Алгоритм:
    1. Открываем изображение из bytes
    2. Исправляем EXIF-ориентацию
    3. Изменяем размер методом cover (сохраняя пропорции, обрезая лишнее)
    4. Конвертируем в целевой формат
    
    Args:
        image_data: Исходные байты изображения
        target_width: Целевая ширина
        target_height: Целевая высота
        quality: Качество JPEG/WebP (1-100)
        output_format: "WEBP" или "JPEG"
        
    Returns:
        (bytes, mime_type): Обработанное изображение и его MIME-тип
    """
    # Открываем изображение
    img = Image.open(io.BytesIO(image_data))
    
    # Исправляем ориентацию
    img = fix_exif_orientation(img)
    
    # Конвертируем в RGB если нужно (PNG с прозрачностью → RGB)
    if img.mode in ('RGBA', 'LA', 'P'):
        # Создаём белый фон для прозрачности
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Вычисляем размеры для cover (как в CSS background-size: cover)
    # Изображение должно заполнить всю целевую область, часть может быть обрезана
    img_aspect = img.width / img.height
    target_aspect = target_width / target_height
    
    if img_aspect > target_aspect:
        # Изображение шире — подгоняем по высоте, обрезаем по ширине
        new_height = target_height
        new_width = int(target_height * img_aspect)
    else:
        # Изображение выше — подгоняем по ширине, обрезаем по высоте
        new_width = target_width
        new_height = int(target_width / img_aspect)
    
    # Изменяем размер
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Обрезаем до целевого размера (center crop)
    left = (new_width - target_width) // 2
    top = (new_height - target_height) // 2
    right = left + target_width
    bottom = top + target_height
    
    img = img.crop((left, top, right, bottom))
    
    # Сохраняем в буфер
    output = io.BytesIO()
    
    if output_format.upper() == "WEBP":
        img.save(output, format="WEBP", quality=quality, method=6)
        mime_type = "image/webp"
    else:  # JPEG
        img.save(output, format="JPEG", quality=quality, optimize=True)
        mime_type = "image/jpeg"
    
    output.seek(0)
    return output.read(), mime_type


def process_skin_image(
    image_data: bytes
) -> Tuple[bytes, bytes, bytes, str, str]:
    """
    Обрабатывает загруженное изображение скина и создаёт все необходимые варианты.
    
    Returns:
        (banner_bytes, background_bytes, thumbnail_bytes, dominant_color, secondary_color)
        
    Размеры:
    - Banner: 1200x400 (широкий баннер для хедеров)
    - Background: 800x800 (квадратный фон для now-playing)
    - Thumbnail: 300x200 (миниатюра для карточек)
    """
    # Извлекаем цвета из оригинала
    original_img = Image.open(io.BytesIO(image_data))
    original_img = fix_exif_orientation(original_img)
    
    dominant = get_dominant_color(original_img)
    secondary = get_secondary_color(original_img, dominant)
    
    # Создаём варианты разных размеров
    banner, _ = resize_and_crop_image(image_data, 1200, 400, quality=85, output_format="WEBP")
    background, _ = resize_and_crop_image(image_data, 800, 800, quality=85, output_format="WEBP")
    thumbnail, _ = resize_and_crop_image(image_data, 300, 200, quality=80, output_format="WEBP")
    
    return banner, background, thumbnail, dominant, secondary


def validate_image_upload(file_data: bytes, max_size_mb: int = 10) -> bool:
    """
    Проверяет что загруженный файл — корректное изображение и не превышает лимит размера.
    """
    if len(file_data) > max_size_mb * 1024 * 1024:
        return False
    
    try:
        img = Image.open(io.BytesIO(file_data))
        img.verify()
        return True
    except Exception:
        return False
