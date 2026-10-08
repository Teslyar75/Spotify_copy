"""
Тематические теги Jamendo для каждого скина.

Каждый скин связан с определёнными жанрами/настроением музыки,
которые подходят к его визуальному стилю.
"""

# Маппинг: название скина → теги Jamendo (через пробел)
SKIN_MUSIC_TAGS = {
    "Стандартный": "pop rock indie electronic",  # Универсальные жанры для нейтрального скина
    "Классический Spotify": "pop rock indie electronic",  # Универсальные популярные жанры
    "Неоновая Ночь": "electronic synthwave cyberpunk techno",  # Киберпанк/электроника
    "Ретро Волны": "synthwave electronic retro 80s",  # Синтвейв
    "Минимализм": "ambient minimal piano classical",  # Минималистичная/эмбиент
    "Космос": "ambient electronic space soundtrack",  # Космическая/эмбиент
    "Закат": "chillout lounge downtempo acoustic",  # Спокойная/лаунж
    "Броня гения": "rock electronic metal industrial",  # Энергичная/индастриал
    "Ночной паутинщик": "rock electronic alternative indie",  # Альтернативная/рок
    "Бейкер-стрит": "classical jazz acoustic instrumental",  # Классическая/джаз для детектива
    "Викинги": "folk epic ambient soundtrack",  # Народная/эпическая для северной темы
    "Железный трон": "orchestral cinematic epic soundtrack",  # Оркестровая/эпическая для средневековья
}

# Fallback теги если основные вернули мало треков
SKIN_MUSIC_FALLBACK = {
    "Стандартный": "pop rock",
    "Классический Spotify": "pop rock",
    "Неоновая Ночь": "electronic",
    "Ретро Волны": "electronic",
    "Минимализм": "ambient",
    "Космос": "ambient electronic",
    "Закат": "chillout",
    "Броня гения": "rock",
    "Ночной паутинщик": "rock",
    "Бейкер-стрит": "jazz",
    "Викинги": "folk",
    "Железный трон": "orchestral",
}

def get_tags_for_skin(skin_name: str) -> tuple[str, str]:
    """
    Получить теги Jamendo для скина.
    
    Returns:
        (primary_tags, fallback_tags)
    """
    primary = SKIN_MUSIC_TAGS.get(skin_name, "pop rock indie")
    fallback = SKIN_MUSIC_FALLBACK.get(skin_name, "pop rock")
    return primary, fallback
