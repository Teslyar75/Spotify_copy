# База данных Spotify Clone

Схема базы данных для учебного проекта — копии музыкального сервиса Spotify.

## Стек

- **PostgreSQL** — СУБД
- **SQLAlchemy** — ORM
- **Alembic** — миграции
- **FastAPI** — API

## Быстрый старт

```bash
# 1. Запустить PostgreSQL (Docker)
docker-compose up -d

# 2. Установить зависимости
pip install -r requirements.txt

# 3. Создать .env (скопировать из .env.example)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spotify_clone

# 4. Применить миграции
alembic upgrade head

# 5. Запустить API
uvicorn app.main:app --reload
```

## Структура

### Основная БД

| Сервис | Таблица | Описание |
|--------|---------|----------|
| **Auth Service** | `auth_users` | Аутентификация: email, хеш пароля |
| **User Service** | `user_profiles` | Профили: username, аватар, био |
| **Track Service** | `tracks` | Треки: название, исполнитель, альбом, длительность, ссылка на файл |
| **Playlist Service** | `playlists` | Плейлисты: владелец, название, публичность |
| **Playlist Service** | `playlist_tracks` | Связь плейлистов и треков с позицией |
| **Player/History** | `listening_history` | История прослушиваний |

### Отдельная БД (`schema_recommendations.sql`)

| Сервис | Таблица | Описание |
|--------|---------|----------|
| **Recommendation Service** | `recommendations` | Рекомендации (не в основной БД) |

## Миграции

```bash
# Создать новую миграцию (при запущенном PostgreSQL)
alembic revision --autogenerate -m "описание"

# Применить миграции
alembic upgrade head

# Откатить последнюю
alembic downgrade -1
```

## Связи

- `user_profiles.id` → `auth_users.id` (1:1)
- `playlists.owner_id` → `auth_users.id`
- `playlist_tracks.playlist_id` → `playlists.id`
- `playlist_tracks.track_id` → `tracks.id`
- `listening_history.user_id` → `auth_users.id`
- `listening_history.track_id` → `tracks.id`
