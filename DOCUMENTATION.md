# Документация проекта Spotify Clone

Подробное описание проекта Spotify Clone с fullstack реализацией.

---

## Содержание

1. [Инструкция по запуску](#инструкция-по-запуску-проекта)
2. [Обзор проекта](#обзор-проекта)
3. [Архитектура базы данных](#архитектура-базы-данных)
4. [Технологический стек](#технологический-стек)
5. [Структура проекта](#структура-проекта)
6. [Модели данных (ORM)](#модели-данных-orm)
7. [Миграции](#миграции)
8. [API](#api)
9. [WebSocket](#websocket)
10. [Аутентификация](#аутентификация)
11. [Frontend](#frontend)
12. [Дизайн и UI](#дизайн-и-ui)
13. [Конфигурация](#конфигурация)
14. [История изменений](#история-изменений-changelog)

---

## Инструкция по запуску проекта

### Вариант A: Docker (рекомендуется)

**Требуется:** Docker Desktop

```powershell
cd D:\Spotify_copy
.\run-docker.ps1
```

Или вручную:
```powershell
docker-compose up -d --build
```

После запуска:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

**Seed (тестовые данные):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed" -Method POST
```

**Вход:** `test@example.com` / `test123`

**Остановка:** `docker-compose down`

**API документация:** http://localhost:8000/docs

---

### Вариант B: Локальный запуск

**Требуется:** Python 3.10+, Node.js 20.19+, PostgreSQL 16 (или Docker для postgres)

**1. PostgreSQL:**
```powershell
docker-compose up -d postgres
```

**2. Backend:**
```powershell
cd D:\Spotify_copy
copy .env.example .env
pip install -r requirements.txt
python -m alembic upgrade head
.\run.ps1
```

**3. Frontend** (в новом терминале):
```powershell
cd D:\Spotify_copy\frontend
npm install
npm run dev
```

**4. Seed:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed" -Method POST
```

**5. Открыть:** http://localhost:3000

**API документация:** http://localhost:8000/docs

---

### Важно

- **Ошибка 500** — обычно означает, что PostgreSQL не запущен. Запустите `docker-compose up -d postgres` и подождите 5–10 секунд.
- **Ошибка 401 при входе** — проверьте, что seed выполнен (создан тестовый пользователь).

---

## Обзор проекта

**Spotify Clone** — fullstack проект, представляющий собой копию музыкального сервиса Spotify.

### Возможности

- 🎵 **Воспроизведение музыки** — треки, альбомы, плейлисты
- 🔍 **Поиск** — по трекам, альбомам и артистам
- 📚 **Your Library** — плейлисты и альбомы пользователя
- 🔐 **Аутентификация** — регистрация, вход, JWT токены (автообновление при 401)
- 🎤 **Информация об исполнителе** — выезжающая панель с данными артиста и расписанием концертов
- 📊 **Админ панель** — управление треками и альбомами
- 📱 **Адаптивный дизайн** — работа на desktop и мобильных

### Основные компоненты

1. **Backend** — FastAPI (Python) + PostgreSQL
2. **Frontend** — React + TypeScript + Vite

---

## Архитектура базы данных

База данных спроектирована по микросервисной логике: каждая таблица соответствует определённому сервису.

### Основная база данных

#### 1. Auth Service — `auth_users`

Таблица аутентификации пользователей.

| Поле          | Тип         | Описание                          |
|---------------|-------------|-----------------------------------|
| id            | UUID        | PK, уникальный идентификатор      |
| email         | VARCHAR(255)| Уникальный email                  |
| password_hash | VARCHAR(255)| Хеш пароля                        |
| created_at    | TIMESTAMP   | Дата создания записи              |

**Индексы:** `email` (unique)

---

#### 2. User Service — `user_profiles`

Профили пользователей (связаны 1:1 с `auth_users`).

| Поле       | Тип         | Описание                    |
|------------|-------------|-----------------------------|
| id         | UUID        | PK, FK → auth_users.id      |
| username   | VARCHAR(50) | Уникальное имя пользователя |
| avatar_url | VARCHAR(255)| Ссылка на аватар            |
| bio        | VARCHAR(500)| Короткая биография         |
| created_at | TIMESTAMP   | Дата создания профиля       |
| updated_at | TIMESTAMP   | Дата последнего обновления  |

**Индексы:** `username` (unique)

---

#### 3. Track Service — `tracks`

Музыкальные треки.

| Поле       | Тип         | Описание                    |
|------------|-------------|-----------------------------|
| id         | UUID        | PK                          |
| title      | VARCHAR(255)| Название трека              |
| artist     | VARCHAR(255)| Исполнитель                 |
| album_name | VARCHAR(255)| Название альбома (nullable) |
| album_id   | UUID        | FK → albums.id (nullable)   |
| image_url  | VARCHAR(500)| Обложка (nullable)          |
| duration   | INT         | Длительность в секундах     |
| file_url   | VARCHAR(500)| Ссылка на файл трека       |
| created_at | TIMESTAMP   | Дата добавления             |
| updated_at | TIMESTAMP   | Дата обновления             |

**Ограничения:** `duration > 0`  
**Индексы:** `artist`, `album_name`, `album_id`

---

#### 4. Album Service — `albums`

Музыкальные альбомы.

| Поле        | Тип         | Описание           |
|-------------|-------------|--------------------|
| id          | UUID        | PK                 |
| title       | VARCHAR(255)| Название альбома   |
| artist      | VARCHAR(255)| Исполнитель        |
| image_url   | VARCHAR(500)| Обложка            |
| release_year| INT         | Год выпуска        |
| created_at  | TIMESTAMP   | Дата создания      |
| updated_at  | TIMESTAMP   | Дата обновления    |

---

#### 5. Playlist Service — `playlists`

Плейлисты пользователей.

| Поле      | Тип         | Описание                    |
|-----------|-------------|-----------------------------|
| id        | UUID        | PK                          |
| owner_id  | UUID        | FK → user_profiles.id       |
| title     | VARCHAR(255)| Название плейлиста          |
| is_public | BOOLEAN     | Публичный или приватный     |
| created_at| TIMESTAMP   | Дата создания               |

**Индексы:** `owner_id`

---

#### 6. Playlist Service — `playlist_tracks`

Связь плейлистов и треков (многие-ко-многим с позицией).

| Поле        | Тип  | Описание                      |
|-------------|------|-------------------------------|
| id          | UUID | PK                            |
| playlist_id | UUID | FK → playlists.id             |
| track_id    | UUID | FK → tracks.id                |
| position    | INT  | Позиция трека в плейлисте     |

**Ограничения:** `position >= 0`, UNIQUE(playlist_id, position)  
**Индексы:** `playlist_id`, `track_id`

---

#### 7. Player / History Service — `listening_history`

История прослушиваний.

| Поле     | Тип      | Описание              |
|----------|----------|-----------------------|
| id       | UUID     | PK                     |
| user_id  | UUID     | FK → auth_users.id     |
| track_id | UUID     | FK → tracks.id         |
| played_at| TIMESTAMP| Время прослушивания    |

**Индексы:** `user_id`, `track_id`, `played_at` (DESC)

---

#### 8. Дополнительные таблицы

- **user_status** — онлайн статусы пользователей
- **messages** — сообщения чата

---

### Диаграмма связей

```
auth_users (1) ──────< (1) user_profiles
    │
    ├──────< (N) listening_history >────── (N) tracks
    │
    └── user_profiles
            │
            └──────< (N) playlists
                        │
                        └──────< (N) playlist_tracks >────── (N) tracks
                                                                    │
                                                                    └────── (N) albums
```

---

## Технологический стек

| Компонент   | Технология   | Версия  |
|-------------|--------------|---------|
| **Backend** |
| Фреймворк   | FastAPI      | 0.109+  |
| ORM         | SQLAlchemy   | 2.0+    |
| Миграции    | Alembic      | 1.13+   |
| СУБД        | PostgreSQL   | 16      |
| Auth        | python-jose, bcrypt | 3.3+, 4.0+ |
| ASGI-сервер | Uvicorn      | 0.27+   |
| **Frontend** |
| Фреймворк   | React        | 19.x    |
| Язык        | TypeScript   | 5.x     |
| Сборщик     | Vite         | 7.x     |
| Стили       | Tailwind CSS | 3.x     |
| State       | Zustand      | 5.x     |
| Роутинг     | React Router | 7.x     |
| UI          | Radix UI     | latest  |
| HTTP        | Axios        | 1.x     |

---

## Структура проекта

```
Spotify_copy/
│
├── app/                          # Backend приложение FastAPI
│   ├── __init__.py
│   ├── config.py                 # Конфигурация
│   ├── database.py               # Подключение SQLAlchemy, get_db()
│   ├── dependencies.py           # Зависимости (get_current_user_id)
│   ├── main.py                   # Точка входа FastAPI
│   ├── utils.py                  # Утилиты аутентификации
│   ├── websocket.py              # WebSocket менеджер
│   ├── schemas.py                # Pydantic схемы
│   │
│   ├── models/                   # Модели ORM
│   │   ├── __init__.py
│   │   ├── auth_user.py
│   │   ├── user_profile.py
│   │   ├── user_status.py
│   │   ├── track.py
│   │   ├── album.py
│   │   ├── playlist.py
│   │   ├── playlist_track.py
│   │   ├── listening_history.py
│   │   └── message.py
│   │
│   └── routes/                   # API endpoints
│       ├── auth.py               # Аутентификация
│       ├── songs.py              # Треки
│       ├── albums.py             # Альбомы
│       ├── playlists.py          # Плейлисты
│       ├── users.py              # Пользователи
│       ├── search.py             # Поиск
│       ├── seed.py               # Наполнение тестовыми данными
│       ├── player.py             # История прослушиваний
│       ├── recommendations.py   # Рекомендации
│       └── websocket.py          # WebSocket endpoint
│
├── frontend/                     # Frontend приложение React
│   ├── src/
│   │   ├── components/           # UI компоненты
│   │   │   ├── ui/               # Базовые компоненты (Radix)
│   │   │   ├── skeletons/        # Skeleton загрузчики
│   │   │   └── Topbar.tsx
│   │   ├── layout/               # Layout
│   │   │   ├── MainLayout.tsx
│   │   │   └── components/       # LeftSidebar, ArtistInfoSidebar, AudioPlayer, PlaybackControls
│   │   ├── pages/                # Страницы
│   │   │   ├── home/             # Главная
│   │   │   ├── search/           # Поиск
│   │   │   ├── library/          # Your Library
│   │   │   ├── album/            # Страница альбома
│   │   │   ├── admin/            # Админ панель
│   │   │   ├── login/            # Вход/регистрация
│   │   │   └── 404/              # Страница не найдена
│   │   ├── stores/               # Zustand stores (auth, player, music, artist)
│   │   ├── providers/            # AuthProvider
│   │   ├── types/                # TypeScript типы
│   │   ├── lib/                  # axios, utils
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/                   # Статические файлы
│   │   ├── favicon.svg           # Иконка Spotify
│   │   ├── spotify.png
│   │   └── media/                # (опционально) локальные медиа; по умолчанию — внешние URL
│   ├── package.json
│   └── vite.config.ts
│
├── alembic/                      # Миграции
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── database/                     # SQL-схемы
├── scripts/
├── .vscode/                      # Настройки редактора (форматирование)
├── .env.example
├── alembic.ini
├── docker-compose.yml            # PostgreSQL + Backend + Frontend
├── Dockerfile.backend
├── requirements.txt
├── requirements-dev.txt          # autopep8, isort
├── pyproject.toml                # Конфигурация Black, isort
├── run.ps1                       # Запуск backend (локально)
├── run-docker.ps1                # Запуск в Docker
├── migrate.ps1                   # Применение миграций
├── DOCUMENTATION.md              # Данная документация
└── STUDENT_GUIDE.md              # Гайд для студентов
```

---

## Модели данных (ORM)

### Track (`app/models/track.py`)

```python
class Track(Base):
    __tablename__ = "tracks"
    id = Column(PG_UUID, primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    artist = Column(String(255), nullable=False, index=True)
    album_name = Column(String(255), nullable=True, index=True)
    album_id = Column(PG_UUID, ForeignKey("albums.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String(500), nullable=True)
    duration = Column(Integer, nullable=False)
    file_url = Column(String(500), nullable=False)
    # ...
```

**Связи:** `album_ref` (Album), `playlist_tracks`, `listening_history`

---

### Album (`app/models/album.py`)

```python
class Album(Base):
    __tablename__ = "albums"
    id = Column(PG_UUID, primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    artist = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=False)
    release_year = Column(Integer, nullable=False)
    # ...
```

**Связи:** `songs` (Track)

---

### Playlist (`app/models/playlist.py`)

```python
class Playlist(Base):
    __tablename__ = "playlists"
    owner_id = Column(PG_UUID, ForeignKey("user_profiles.id", ondelete="CASCADE"), ...)
    # ...
```

**Связи:** `owner` (UserProfile), `tracks` (через PlaylistTrack)

---

## Миграции

### Текущие миграции

- **001** — initial_schema (auth_users, user_profiles, tracks, playlists, playlist_tracks, listening_history)
- **002** — add_music_tables (albums)
- **002** — fix_listening_history_index
- **003** — fk_to_user_profiles (FK playlists → user_profiles)

### Команды Alembic

```powershell
# Текущая версия
python -m alembic current

# Применить все миграции
python -m alembic upgrade head

# Откатить последнюю миграцию
python -m alembic downgrade -1

# Создать новую миграцию
python -m alembic revision --autogenerate -m "описание"
```

---

## API

### Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Информация о API |
| GET | `/health` | Проверка здоровья и БД |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |

### Auth (`/api/auth`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Проверка работоспособности auth-сервиса |
| POST | `/register` | Регистрация (email, username, password) |
| POST | `/login` | Вход (email, password) |
| POST | `/logout` | Выход |
| POST | `/refresh` | Обновление токена |
| GET | `/me` | Текущий пользователь (Bearer) |

### Users (`/api/users`) — User Service

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Health check User Service |
| GET | `/me` | Профиль текущего пользователя (создаётся при первом обращении) |
| PUT | `/me` | Обновить профиль (username, avatar_url, bio) |
| GET | `/` | Все пользователи (только публичные данные) |
| GET | `/{id}` | Профиль по ID |
| GET | `/messages/{user_id}` | Сообщения с пользователем |

**Профиль:** `id`, `username`, `avatar_url`, `bio` (без email). JWT обязателен.

### Songs (`/api/songs`) — Track Service

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Health check Track Service |
| GET | `/` | Все треки (пагинация: `?limit=50&offset=0`) |
| GET | `/featured` | Избранные |
| GET | `/made-for-you` | Создано для вас |
| GET | `/trending` | Трендовые |
| GET | `/{id}` | Трек по ID |
| POST | `/` | Создать трек (только админ, Bearer) |
| PUT | `/{id}` | Обновить трек (только админ, Bearer) |
| DELETE | `/{id}` | Удалить трек (только админ, Bearer) |

**Пагинация:** `limit` (1–100, по умолчанию 50), `offset` (по умолчанию 0). Админ: email в `ADMIN_EMAILS`.

### Albums (`/api/albums`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Все альбомы |
| GET | `/{id}` | Альбом по ID с треками |

### Playlists (`/api/playlists`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Все плейлисты |
| GET | `/me` | Плейлисты текущего пользователя (Bearer) |
| GET | `/{id}` | Плейлист по ID |
| POST | `/` | Создать плейлист |
| POST | `/{id}/tracks` | Добавить трек |

### Search (`/api/search`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/?q=запрос` | Поиск по трекам, альбомам и артистам |

**Ответ:**
```json
{
  "tracks": [...],
  "albums": [...],
  "artists": [{"name": "..."}]
}
```

### Player (`/api/player`) — Player / History Service

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Health check Player Service |
| POST | `/play` | Записать прослушивание трека (body: `{track_id}`) |
| GET | `/history` | История прослушиваний текущего пользователя |

JWT обязателен. При каждом play создаётся запись в `listening_history`.

### Recommendations (`/api/recommendations`) — Recommendation Service

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Health check Recommendation Service |
| GET | `/` | Персонализированные рекомендации (rule-based MVP) |

**Логика (rule-based):** история прослушиваний → артисты; плейлисты пользователя; новые треки. Кэш: `RECOMMENDATION_CACHE_TTL` сек.

### Seed (`/api/seed`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/seed` | Наполнить БД тестовыми данными |
| POST | `/seed?force=true` | Обновить URL треков (file_url, image_url) без пересоздания БД |

**Тестовый пользователь:** `test@example.com` / `test123`  
**Треки:** используют внешние URL (SoundHelix), локальные файлы не требуются.

---

## WebSocket

WebSocket endpoint присутствует в backend (`/socket.io`), но **не используется во frontend**. Чат и активность друзей отключены.

---

## Аутентификация

### Способ входа

- **Email + пароль** — регистрация и вход (OAuth отключён)

### Тестовый аккаунт

- **Email:** `test@example.com`
- **Пароль:** `test123`

(Создаётся при первом вызове `POST /api/seed/seed`)

### JWT Токены

- **Access Token** — 30 минут
- **Refresh Token** — 7 дней

### Автообновление токена (401)

При ответе **401 Unauthorized** axios interceptor автоматически:
1. Вызывает `POST /api/auth/refresh` с refresh_token
2. Сохраняет новые токены в localStorage и store
3. Повторяет исходный запрос с новым access_token
4. При неудаче refresh — логаут и редирект на `/login`

Это устраняет ошибки 401 при переходе между страницами и долгой работе в приложении.

### Защищённые endpoints

Требуют заголовок: `Authorization: Bearer <access_token>`

- `GET /api/auth/me`
- `GET /api/playlists/me`

---

## Frontend

### Страницы

| Страница | Путь | Описание |
|----------|------|----------|
| Login | `/login` | Вход и регистрация |
| Home | `/` | Главная с треками |
| Search | `/search` | Поиск по трекам, альбомам, артистам |
| Library | `/library` | Плейлисты и альбомы пользователя |
| Album | `/albums/:id` | Страница альбома |
| Admin | `/admin` | Панель администратора |

### Stores (Zustand)

- **useAuthStore** — аутентификация, refresh токена
- **usePlayerStore** — плеер (очередь, воспроизведение)
- **useMusicStore** — музыка (featured, trending, albums, search)
- **useArtistStore** — выбранный исполнитель, открытие панели

### Layout

- **MainLayout** — layout (LeftSidebar | content | кнопка «Исполнитель»)
- **LeftSidebar** — Home, Search, Your Library, альбомы
- **ArtistInfoSidebar** — выезжающая панель с информацией об исполнителе и расписанием концертов
- **PlaybackControls** — плеер (play/pause, progress, volume); имя артиста кликабельно
- **Topbar** — навигация Back/Forward, Admin, профиль

---

## Дизайн и UI

### Цветовая схема (Spotify)

| Цвет | HEX | Использование |
|------|-----|---------------|
| Spotify Green | #1DB954 | Кнопки, акценты |
| Black | #121212 | Основной фон |
| Charcoal | #181818 | Карточки, панели |
| Text Muted | #b3b3b3 | Вторичный текст |

### Шрифт

- **Plus Jakarta Sans** — основной (альтернатива Circular)
- **Inter** — fallback

### Особенности

- **Favicon** — SVG в стиле Spotify (`/favicon.svg`)
- **Скроллбар** — кастомный в стиле Spotify
- **Анимации** — плавные переходы при смене страниц
- **Адаптивность** — на мобильных скрываются боковые панели

---

## Конфигурация

### Backend (.env в корне)

| Переменная | Описание | Пример |
|------------|----------|--------|
| DATABASE_URL | Подключение к PostgreSQL | postgresql://postgres:postgres@localhost:5432/spotify_clone |
| CORS_ORIGINS | Разрешённые origins (через запятую) | http://localhost:3000,http://localhost:3001,http://localhost:3002,... |
| ADMIN_EMAILS | Email админов через запятую (создание/редактирование треков) | admin@example.com |
| RECOMMENDATION_CACHE_TTL | TTL кэша рекомендаций в секундах (0 = без кэша) | 300 |
| SECRET_KEY | Секретный ключ для JWT | your-secret-key |
| ACCESS_TOKEN_EXPIRE_MINUTES | Время жизни access токена | 30 |
| REFRESH_TOKEN_EXPIRE_DAYS | Время жизни refresh токена | 7 |

### Frontend (vite.config.ts, axios)

- **Proxy** — `/api` → `http://localhost:8000`, `/ws` → `ws://localhost:8000`
- **Axios baseURL** — `/api` (запросы идут через Vite proxy, CORS не требуется)

---

## Чек-лист выполненной работы

| Задача | Статус |
|--------|--------|
| Инициализация БД | ✅ |
| Модели ORM (Track, Album, Playlist...) | ✅ |
| Миграции Alembic | ✅ |
| FastAPI + REST API | ✅ |
| Аутентификация JWT + автообновление при 401 | ✅ |
| Поиск (Search) | ✅ |
| Your Library (плейлисты) | ✅ |
| Frontend (React + Vite) | ✅ |
| Панель «Об исполнителе» (расписание концертов) | ✅ |
| Дизайн в стиле Spotify | ✅ |
| CORS настройка | ✅ |
| Форматирование (autopep8) | ✅ |
| Docker Compose | ✅ |
| Документация | ✅ |

---

## История изменений (Changelog)

### 2026-03 (все изменения)

**Аутентификация:**
- `bcrypt` вместо `passlib` (хеширование паролей)
- `requirements.txt`: `passlib[bcrypt]` заменён на `bcrypt>=4.0.0`
- OAuth (Google, GitHub) удалён — только email + пароль
- Axios interceptor: при 401 автоматически обновляет токен через `/api/auth/refresh` и повторяет запрос
- События: `auth:logout` (при неудачном refresh), `auth:token-refreshed` (синхронизация store)
- `setTokensFromRefresh` в useAuthStore

**Треки и медиа:**
- Треки используют внешние URL (SoundHelix) вместо локальных `/media/`
- Seed: `POST /api/seed/seed?force=true` — обновление URL треков без пересоздания БД
- Обложки альбомов из picsum.photos

**Чат → панель «Об исполнителе»:**
- Чат удалён: ChatPage, FriendsActivity, useChatStore
- Добавлена **ArtistInfoSidebar** — выезжающая панель с информацией об артисте и mock-расписанием концертов
- **useArtistStore** — store для выбранного исполнителя
- Клик по имени артиста открывает панель (плеер, главная, альбом)
- Кнопка «Исполнитель» в правом sidebar
- Удалена кнопка Chat в Topbar

**WebSocket:**
- Отключён во frontend (AuthProvider больше не инициализирует socket)
- Удалены вызовы `socket.emit` из usePlayerStore

**Frontend:**
- Axios baseURL: `/api` (через Vite proxy, CORS не требуется)
- CORS: добавлены порты 3001, 3002

**Docker:**
- `run-docker.ps1` — скрипт запуска
- `CORS_ORIGINS` в docker-compose для backend
- Убраны volumes для media (треки — SoundHelix)
- `frontend/public/media/` — папка с `.gitkeep`
- `.env.docker.example` — пример для Docker

**Документация:**
- `DOCUMENTATION.md` и `STUDENT_GUIDE.md` обновлены

---

*Документация обновлена 11.03.2026*
