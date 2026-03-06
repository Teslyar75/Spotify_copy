# Документация проекта Spotify Clone

Подробное описание проекта Spotify Clone с fullstack реализацией.

---

## Содержание

1. [Обзор проекта](#обзор-проекта)
2. [Архитектура базы данных](#архитектура-базы-данных)
3. [Технологический стек](#технологический-стек)
4. [Структура проекта](#структура-проекта)
5. [Модели данных (ORM)](#модели-данных-orm)
6. [Миграции](#миграции)
7. [API](#api)
8. [WebSocket](#websocket)
9. [Аутентификация](#аутентификация)
10. [Frontend](#frontend)
11. [Дизайн и UI](#дизайн-и-ui)
12. [Конфигурация](#конфигурация)
13. [Инструкция по запуску](#инструкция-по-запуску)

---

## Обзор проекта

**Spotify Clone** — fullstack проект, представляющий собой копию музыкального сервиса Spotify с real-time функционалом.

### Возможности

- 🎵 **Воспроизведение музыки** — треки, альбомы, плейлисты
- 🔍 **Поиск** — по трекам, альбомам и артистам
- 📚 **Your Library** — плейлисты и альбомы пользователя
- 🔐 **Аутентификация** — регистрация, вход, JWT токены
- 💬 **Real-time чат** — личные сообщения между пользователями
- 👥 **Онлайн статусы** — отображение онлайн/офлайн пользователей
- 🎧 **Активность** — что играет у пользователя в реальном времени
- 📊 **Админ панель** — управление треками и альбомами
- 📱 **Адаптивный дизайн** — работа на desktop и мобильных

### Основные компоненты

1. **Backend** — FastAPI (Python) + PostgreSQL
2. **Frontend** — React + TypeScript + Vite
3. **WebSocket** — Socket.IO для real-time обновлений

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
| Auth        | python-jose  | 3.3+    |
| WebSocket   | python-socketio | 5.x   |
| ASGI-сервер | Uvicorn      | 0.27+   |
| **Frontend** |
| Фреймворк   | React        | 19.x    |
| Язык        | TypeScript   | 5.x     |
| Сборщик     | Vite         | 7.x     |
| Стили       | Tailwind CSS | 3.x     |
| State       | Zustand      | 5.x     |
| Роутинг     | React Router | 7.x     |
| WebSocket   | socket.io-client | 4.x |
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
│   │   │   └── components/       # LeftSidebar, FriendsActivity, AudioPlayer, PlaybackControls
│   │   ├── pages/                # Страницы
│   │   │   ├── home/             # Главная
│   │   │   ├── search/           # Поиск
│   │   │   ├── library/          # Your Library
│   │   │   ├── album/            # Страница альбома
│   │   │   ├── chat/             # Чат
│   │   │   ├── admin/            # Админ панель
│   │   │   ├── login/            # Вход/регистрация
│   │   │   ├── auth-callback/    # OAuth callback
│   │   │   └── 404/              # Страница не найдена
│   │   ├── stores/               # Zustand stores
│   │   ├── providers/            # AuthProvider
│   │   ├── types/                # TypeScript типы
│   │   ├── lib/                  # axios, utils
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/                   # Статические файлы
│   │   ├── favicon.svg           # Иконка Spotify
│   │   ├── spotify.png
│   │   └── media/                # Песни и обложки
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
├── run.ps1                       # Запуск backend
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
| POST | `/register` | Регистрация |
| POST | `/login` | Вход |
| POST | `/logout` | Выход |
| POST | `/refresh` | Обновление токена |
| GET | `/me` | Текущий пользователь (Bearer) |

### Songs (`/api/songs`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Все треки |
| GET | `/featured` | Избранные |
| GET | `/made-for-you` | Создано для вас |
| GET | `/trending` | Трендовые |
| GET | `/{id}` | Трек по ID |

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

### Seed (`/api/seed`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/` | Наполнить БД тестовыми данными |

---

## WebSocket

WebSocket используется для real-time обновлений:

### Функции

1. **Онлайн статусы** — отображение подключенных пользователей
2. **Активность** — что играет пользователь в реальном времени
3. **Чат** — личные сообщения между пользователями

### Подключение

```typescript
const socket = io("ws://localhost:8000", {
  auth: {
    token: "Bearer <access_token>",
    userId: "<user_id>"
  }
});
```

### События

| Направление | Событие | Описание |
|-------------|---------|----------|
| С→С | `send_message` | Отправить сообщение |
| С→С | `update_activity` | Обновить активность |
| С→К | `users_online` | Список онлайн |
| С→К | `receive_message` | Получено сообщение |
| С→К | `activity_updated` | Активность обновлена |

---

## Аутентификация

### JWT Токены

- **Access Token** — 30 минут
- **Refresh Token** — 7 дней

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
| Chat | `/chat` | Чат |
| Admin | `/admin` | Панель администратора |

### Stores (Zustand)

- **useAuthStore** — аутентификация
- **usePlayerStore** — плеер (очередь, воспроизведение)
- **useMusicStore** — музыка (featured, trending, albums, search)
- **useChatStore** — чат и WebSocket

### Layout

- **MainLayout** — трёхколоночный layout (sidebar | content | friends)
- **LeftSidebar** — Home, Search, Your Library, альбомы
- **FriendsActivity** — активность друзей, чат
- **PlaybackControls** — плеер (play/pause, progress, volume)
- **Topbar** — навигация Back/Forward, Chat, Admin, профиль

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
| CORS_ORIGINS | Разрешённые origins (через запятую) | http://localhost:3000,http://127.0.0.1:3000 |
| SECRET_KEY | Секретный ключ для JWT | your-secret-key |
| ACCESS_TOKEN_EXPIRE_MINUTES | Время жизни access токена | 30 |
| REFRESH_TOKEN_EXPIRE_DAYS | Время жизни refresh токена | 7 |

### Frontend (vite.config.ts)

- **Proxy** — `/api` → `http://localhost:8000`, `/ws` → `ws://localhost:8000`
- В development режиме API запросы идут через proxy

---

## Инструкция по запуску

### Предварительные требования

- Python 3.10+
- Node.js 20.19+ or 22.12+
- PostgreSQL 16 (локально или Docker)

### Шаг 1: Backend

```powershell
cd D:\Spotify_copy
pip install -r requirements.txt
```

**PostgreSQL:**

```powershell
docker-compose up -d postgres
```

**Конфигурация:**

Создайте `.env` в корне (см. `.env.example`).

**Миграции:**

```powershell
.\migrate.ps1
```

**Запуск:**

```powershell
.\run.ps1
```

Backend: http://localhost:8000

### Шаг 2: Frontend

```powershell
cd D:\Spotify_copy\frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

### Шаг 3: Проверка

1. Откройте http://localhost:3000
2. Зарегистрируйтесь
3. (Опционально) POST http://localhost:8000/api/seed — наполнить тестовыми данными
4. Начните воспроизведение музыки

### API Документация

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Чек-лист выполненной работы

| Задача | Статус |
|--------|--------|
| Инициализация БД | ✅ |
| Модели ORM (Track, Album, Playlist...) | ✅ |
| Миграции Alembic | ✅ |
| FastAPI + REST API | ✅ |
| Аутентификация JWT | ✅ |
| WebSocket (чат, активность) | ✅ |
| Поиск (Search) | ✅ |
| Your Library (плейлисты) | ✅ |
| Frontend (React + Vite) | ✅ |
| Дизайн в стиле Spotify | ✅ |
| CORS настройка | ✅ |
| Форматирование (autopep8) | ✅ |
| Docker Compose | ✅ |
| Документация | ✅ |

---

*Документация актуальна на 06.03.2026*
