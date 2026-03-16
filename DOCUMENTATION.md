# Документация проекта Spotify Clone

Fullstack клон музыкального сервиса Spotify на FastAPI + React.

---

## Содержание

1. [Запуск проекта](#запуск-проекта)
2. [Обзор проекта](#обзор-проекта)
3. [Технологический стек](#технологический-стек)
4. [Архитектура базы данных](#архитектура-базы-данных)
5. [Структура проекта](#структура-проекта)
6. [Модели данных (ORM)](#модели-данных-orm)
7. [Миграции Alembic](#миграции-alembic)
8. [API Reference](#api-reference)
9. [Аутентификация и безопасность](#аутентификация-и-безопасность)
10. [Загрузка медиафайлов](#загрузка-медиафайлов)
11. [Админ-панель](#админ-панель)
12. [Frontend](#frontend)
13. [Конфигурация](#конфигурация)
14. [Docker и деплой](#docker-и-деплой)
15. [История изменений](#история-изменений)

---

## Запуск проекта

### Вариант A: Docker (рекомендуется)

**Требуется:** Docker Desktop

```powershell
cd D:\Spotify_copy
docker-compose up -d --build
```

После запуска:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs

**Тестовые данные:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed" -Method POST
```

**Вход:** `test@example.com` / `test123`

**Остановка:** `docker-compose down`

---

### Вариант B: Локальный запуск

**Требуется:** Python 3.10+, Node.js 20.19+, PostgreSQL 16 (или Docker для БД)

**1. База данных:**
```powershell
docker-compose up -d postgres
```

**2. Backend:**
```powershell
cd D:\Spotify_copy
copy .env.example .env
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

**3. Frontend (в новом терминале):**
```powershell
cd D:\Spotify_copy\frontend
npm install
npm run dev
```

**4. Тестовые данные:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed" -Method POST
```

**5. Открыть:** http://localhost:3000

---

### Типичные ошибки при запуске

| Ошибка | Причина | Решение |
|--------|---------|---------|
| HTTP 500 | PostgreSQL не запущен | `docker-compose up -d postgres` |
| HTTP 401 при входе | Seed не выполнен | Выполнить seed-запрос выше |
| `ModuleNotFoundError` | Не установлены зависимости | `pip install -r requirements.txt` |
| `ERR_CONNECTION_REFUSED` | Backend не запущен | Запустить uvicorn |
| Музыка не играет | Старые `/media/...` пути в БД | `POST /api/seed/seed?force=true` |

---

## Обзор проекта

**Spotify Clone** — fullstack веб-приложение, воспроизводящее ключевые функции Spotify.

### Возможности

- **Воспроизведение музыки** — треки, очередь, прогресс, громкость, повтор, перемотка
- **Альбомы** — страницы альбомов с треками, воспроизведение альбома
- **Поиск** — по названию трека, альбома, имени исполнителя; автопоиск с debounce 400 мс
- **Your Library** — сохранённые альбомы и любимые треки (хранятся в localStorage)
- **Кнопки ♥** — сохранение альбомов и треков в библиотеку со страниц альбома, главной и поиска
- **Аутентификация** — регистрация, вход, JWT (автообновление при 401)
- **Панель «Об исполнителе»** — выезжает при клике на имя артиста
- **Админ-панель** — создание, редактирование, удаление альбомов и треков, загрузка файлов
- **Адаптивный дизайн** — desktop и мобильные устройства

### Архитектура

```
Браузер → Nginx (port 80/3000)
              ├── /         → React SPA (статика)
              ├── /api/*    → FastAPI backend (port 8000)
              ├── /media/*  → FastAPI backend (загруженные файлы)
              └── /ws/*     → FastAPI WebSocket
```

---

## Технологический стек

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| **Backend** | | |
| Фреймворк | FastAPI | 0.109+ |
| ORM | SQLAlchemy | 2.0+ |
| Миграции | Alembic | 1.13+ |
| СУБД | PostgreSQL | 16 |
| Авторизация | python-jose, bcrypt | 3.3+, 4.0+ |
| ASGI-сервер | Uvicorn | 0.27+ |
| **Frontend** | | |
| Фреймворк | React | 19.x |
| Язык | TypeScript | 5.x |
| Сборщик | Vite | 7.x |
| Стили | Tailwind CSS | 3.x |
| State | Zustand | 5.x |
| Роутинг | React Router | 7.x |
| UI-компоненты | Radix UI | latest |
| HTTP-клиент | Axios | 1.x |
| Уведомления | react-hot-toast | latest |
| **Инфраструктура** | | |
| Контейнеризация | Docker + Docker Compose | latest |
| Прокси | Nginx | alpine |

---

## Архитектура базы данных

### Схема таблиц

#### `auth_users` — аутентификация

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID PK | Уникальный идентификатор |
| email | VARCHAR(255) UNIQUE | Email пользователя |
| password_hash | VARCHAR(255) | Bcrypt-хеш пароля |
| initial_username | VARCHAR(50) | Username при регистрации |
| created_at | TIMESTAMP | Дата регистрации |

---

#### `user_profiles` — профили пользователей

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID PK → auth_users.id | Связь с аккаунтом |
| username | VARCHAR(50) UNIQUE | Отображаемое имя |
| avatar_url | VARCHAR(255) | Ссылка на аватар |
| bio | VARCHAR(500) | Биография |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

---

#### `tracks` — музыкальные треки

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID PK | Идентификатор |
| title | VARCHAR(255) | Название трека |
| artist | VARCHAR(255) | Исполнитель |
| album_name | VARCHAR(255) nullable | Название альбома (денормализованное) |
| album_id | UUID nullable → albums.id | FK на альбом (SET NULL при удалении) |
| image_url | VARCHAR(500) nullable | Обложка |
| duration | INTEGER | Длительность в секундах |
| file_url | VARCHAR(500) | Ссылка на аудиофайл |
| created_at | TIMESTAMP | Дата добавления |
| updated_at | TIMESTAMP | Дата обновления |

---

#### `albums` — альбомы

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID PK | Идентификатор |
| title | VARCHAR(255) | Название альбома |
| artist | VARCHAR(255) | Исполнитель |
| image_url | VARCHAR(500) | Обложка (обязательно) |
| release_year | INTEGER | Год выпуска |
| created_at | TIMESTAMP | Дата добавления |
| updated_at | TIMESTAMP | Дата обновления |

Связь: один альбом → много треков (`songs` relationship, `cascade="all, delete-orphan"`)

---

#### `playlists` — плейлисты

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID PK | Идентификатор |
| owner_id | UUID → user_profiles.id | Владелец |
| title | VARCHAR(255) | Название |
| is_public | BOOLEAN | Публичный? |
| created_at | TIMESTAMP | Дата создания |

---

#### `playlist_tracks` — связь плейлистов и треков

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID PK | Идентификатор |
| playlist_id | UUID → playlists.id | Плейлист |
| track_id | UUID → tracks.id | Трек |
| position | INTEGER | Позиция в плейлисте |

Ограничения: `position >= 0`, UNIQUE(playlist_id, position)

---

#### `listening_history` — история прослушиваний

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID PK | Идентификатор |
| user_id | UUID → auth_users.id | Пользователь |
| track_id | UUID → tracks.id | Трек |
| played_at | TIMESTAMP | Время прослушивания |

---

### Диаграмма связей

```
auth_users (1) ──── (1) user_profiles
    │                       │
    └── listening_history   └── playlists
            │                       │
            └── tracks ←────── playlist_tracks
                    │
                    └── albums
```

---

## Структура проекта

```
Spotify_copy/
│
├── app/                        # Backend (FastAPI)
│   ├── main.py                 # Точка входа, CORS, роутеры, /media
│   ├── config.py               # Настройки из .env
│   ├── database.py             # SQLAlchemy engine, get_db()
│   ├── dependencies.py         # get_current_user_id, get_admin_user_id
│   ├── utils.py                # JWT, bcrypt
│   ├── schemas.py              # Pydantic-схемы
│   ├── models/                 # ORM-модели
│   │   ├── auth_user.py
│   │   ├── user_profile.py
│   │   ├── track.py
│   │   ├── album.py
│   │   ├── playlist.py
│   │   ├── playlist_track.py
│   │   └── listening_history.py
│   └── routes/                 # API-роутеры
│       ├── auth.py             # /api/auth
│       ├── songs.py            # /api/songs
│       ├── albums.py           # /api/albums
│       ├── upload.py           # /api/upload (загрузка файлов)
│       ├── playlists.py        # /api/playlists
│       ├── search.py           # /api/search
│       ├── users.py            # /api/users
│       ├── seed.py             # /api/seed
│       ├── player.py           # /api/player
│       ├── recommendations.py  # /api/recommendations
│       └── websocket.py        # WebSocket
│
├── media/                      # Загруженные пользователем файлы
│   ├── images/                 # Обложки альбомов и треков
│   └── songs/                  # Аудиофайлы
│
├── alembic/                    # Миграции
│   └── versions/
│
├── frontend/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.tsx             # Роутинг
│   │   ├── main.tsx            # Точка входа
│   │   ├── pages/
│   │   │   ├── home/           # Главная страница
│   │   │   ├── search/         # Поиск
│   │   │   ├── library/        # Your Library
│   │   │   ├── album/          # Страница альбома
│   │   │   ├── admin/          # Админ-панель (вне MainLayout)
│   │   │   ├── login/          # Вход/регистрация
│   │   │   └── 404/            # Not Found
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   └── components/
│   │   │       ├── LeftSidebar.tsx
│   │   │       ├── PlaybackControls.tsx
│   │   │       ├── AudioPlayer.tsx
│   │   │       └── ArtistInfoSidebar.tsx
│   │   ├── stores/
│   │   │   ├── useAuthStore.ts
│   │   │   ├── usePlayerStore.ts
│   │   │   ├── useMusicStore.ts
│   │   │   └── useArtistStore.ts
│   │   ├── components/ui/      # Radix UI компоненты
│   │   ├── providers/          # AuthProvider
│   │   ├── lib/
│   │   │   └── axios.ts        # axiosInstance + 401 interceptor
│   │   └── types/              # TypeScript типы
│   ├── nginx.conf              # Nginx для production
│   ├── Dockerfile.frontend
│   └── package.json
│
├── docker-compose.yml
├── Dockerfile.backend
├── requirements.txt
├── .env.example
├── DOCUMENTATION.md            # Данный документ
├── STUDENT_GUIDE.md            # Гайд для студентов
└── ADMIN_PANEL.md              # Документация по админ-панели
```

---

## Модели данных (ORM)

### Track

```python
class Track(Base):
    __tablename__ = "tracks"
    id          = Column(PG_UUID, primary_key=True, default=uuid.uuid4)
    title       = Column(String(255), nullable=False)
    artist      = Column(String(255), nullable=False, index=True)
    album_name  = Column(String(255), nullable=True, index=True)   # денормализация
    album_id    = Column(PG_UUID, ForeignKey("albums.id", ondelete="SET NULL"), nullable=True, index=True)
    image_url   = Column(String(500), nullable=True)
    duration    = Column(Integer, nullable=False)
    file_url    = Column(String(500), nullable=False)
    created_at  = Column(DateTime, server_default=func.now())
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())
    album_ref   = relationship("Album", back_populates="songs")
```

### Album

```python
class Album(Base):
    __tablename__ = "albums"
    id           = Column(PG_UUID, primary_key=True, default=uuid.uuid4)
    title        = Column(String(255), nullable=False)
    artist       = Column(String(255), nullable=False)
    image_url    = Column(String(500), nullable=False)
    release_year = Column(Integer, nullable=False)
    songs        = relationship("Track", back_populates="album_ref",
                                cascade="all, delete-orphan")
```

---

## Миграции Alembic

### Применённые миграции

| # | Название | Содержание |
|---|---------|------------|
| 001 | initial_schema | auth_users, user_profiles, tracks, playlists, playlist_tracks, listening_history |
| 002 | add_music_tables | albums |
| 002b | fix_listening_history_index | исправление индекса |
| 003 | fk_to_user_profiles | FK playlists → user_profiles |

### Команды

```powershell
python -m alembic current                          # текущая версия
python -m alembic upgrade head                     # применить всё
python -m alembic downgrade -1                     # откатить последнюю
python -m alembic revision --autogenerate -m "..." # создать миграцию
python -m alembic history                          # история
```

---

## API Reference

### Системные endpoints

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/` | Информация об API |
| GET | `/health` | Проверка соединения с БД |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |

---

### Auth — `/api/auth`

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|---------|
| POST | `/register` | — | Регистрация (email, password, username) |
| POST | `/login` | — | Вход (email, password) |
| POST | `/logout` | — | Выход |
| POST | `/refresh` | — | Обновить access_token по refresh_token |
| GET | `/me` | Bearer | Текущий пользователь |

---

### Songs — `/api/songs`

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|---------|
| GET | `/` | — | Все треки (`?limit=50&offset=0`) |
| GET | `/featured` | — | Избранные (6 случайных) |
| GET | `/made-for-you` | — | Для вас (5 случайных) |
| GET | `/trending` | — | Трендовые (5 случайных) |
| GET | `/{id}` | — | Трек по ID |
| POST | `/` | Bearer + Admin | Создать трек |
| PUT | `/{id}` | Bearer + Admin | Обновить трек |
| DELETE | `/{id}` | Bearer + Admin | Удалить трек |

**Важно:** при создании трека с `album_id` поле `album_name` заполняется автоматически из альбома.

---

### Albums — `/api/albums`

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|---------|
| GET | `/` | — | Все альбомы с треками |
| GET | `/{id}` | — | Альбом по ID |
| POST | `/` | Bearer + Admin | Создать альбом |
| PUT | `/{id}` | Bearer + Admin | Обновить альбом |
| DELETE | `/{id}` | Bearer + Admin | Удалить альбом (и все треки!) |

---

### Upload — `/api/upload`

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|---------|
| POST | `/image` | Bearer + Admin | Загрузить обложку (jpg, png, webp) |
| POST | `/audio` | Bearer + Admin | Загрузить аудио (mp3, wav, ogg) |

**Ответ:** `{"url": "/media/images/xxx.jpg"}`

Файлы сохраняются в Docker volume `media_data` → `/app/media/`.

---

### Playlists — `/api/playlists`

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|---------|
| GET | `/` | — | Все плейлисты |
| GET | `/me` | Bearer | Мои плейлисты |
| GET | `/{id}` | — | Плейлист по ID |
| POST | `/` | Bearer | Создать плейлист |
| POST | `/{id}/tracks` | Bearer | Добавить трек в плейлист |

---

### Search — `/api/search`

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/?q=запрос` | Поиск по трекам (title, artist, album_name), альбомам (title, artist), артистам |

**Важно:** endpoint зарегистрирован с двумя декораторами (`""` и `"/"`), чтобы избежать 307-редиректа через Docker-сеть.

```json
{
  "tracks": [...],
  "albums": [...],
  "artists": [{"name": "..."}]
}
```

---

### Player — `/api/player`

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|---------|
| POST | `/play` | Bearer | Записать прослушивание (`{track_id}`) |
| GET | `/history` | Bearer | История прослушиваний |

---

### Recommendations — `/api/recommendations`

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|---------|
| GET | `/` | Bearer | Персональные рекомендации |

Rule-based алгоритм: история → артисты → новые треки. Кэш: `RECOMMENDATION_CACHE_TTL` сек.

---

### Seed — `/api/seed`

| Метод | Путь | Описание |
|-------|------|---------|
| POST | `/seed` | Создать тестовые данные и пользователя |
| POST | `/seed?force=true` | Обновить URL треков (без пересоздания) |

---

## Аутентификация и безопасность

### JWT токены

- **Access Token** — 30 минут (в Authorization header)
- **Refresh Token** — 7 дней (в localStorage)
- Хранение: `spotify_tokens` в localStorage

### Автообновление токена

При ответе **401 Unauthorized** axios interceptor (`lib/axios.ts`) автоматически:

1. Ставит входящие запросы в очередь
2. Вызывает `POST /api/auth/refresh` с refresh_token
3. Сохраняет новые токены в localStorage
4. Повторяет все отложенные запросы с новым access_token
5. При неудаче → логаут + редирект на `/login`

### Права администратора

Endpoint `get_admin_user_id` в `dependencies.py`:

1. Извлекает user_id из JWT
2. Загружает пользователя из БД
3. Проверяет email в `ADMIN_EMAILS` (из `.env`)
4. Возвращает 403, если не совпадает

Настройка в `.env` или `docker-compose.yml`:
```
ADMIN_EMAILS=test@example.com,admin@mysite.com
```

---

## Загрузка медиафайлов

### Схема работы

```
Браузер → POST /api/upload/image (multipart/form-data)
              → Nginx проксирует на backend
              → FastAPI сохраняет в /app/media/images/
              → Возвращает {"url": "/media/images/xxx.jpg"}
Браузер → GET /media/images/xxx.jpg
              → Nginx проксирует на backend
              → FastAPI StaticFiles отдаёт файл
```

### Разрешённые форматы

| Тип | Форматы |
|-----|---------|
| Изображения | jpg, jpeg, png, webp |
| Аудио | mp3, wav, ogg |

### Хранение в Docker

Файлы хранятся в именованном volume `media_data`, который монтируется в `/app/media/` контейнера backend. Данные сохраняются между перезапусками контейнера.

### Nginx и mp3

В `nginx.conf` правило кэширования статики **не включает mp3** — это важно, иначе Nginx пытается раздавать аудио из HTML-каталога, а не проксировать на backend.

---

## Админ-панель

Подробное описание см. в [ADMIN_PANEL.md](./ADMIN_PANEL.md).

### Краткое описание

- **URL:** http://localhost:3000/admin
- **Доступ:** только для авторизованных пользователей с email в `ADMIN_EMAILS`
- **Возможности:** создание/редактирование/удаление альбомов и треков, загрузка обложек и аудио

### Ключевые технические решения

- AdminPage вынесена **вне MainLayout** (отдельный роут без sidebar и плеера)
- Компонент `FileOrUrlInput` определён **вне AdminPage** — React требует стабильный тип компонента между рендерами
- Кнопки не используют `DialogTrigger` — открытие диалогов через `onClick` и `useState`

---

## Frontend

### Страницы

| Страница | Путь | Layout | Описание |
|----------|------|--------|---------|
| Login | `/login` | — | Вход и регистрация |
| Home | `/` | MainLayout | Главная с featured/trending треками; кнопки ♥ на карточках |
| Search | `/search` | MainLayout | Поиск с debounce; начальный экран — все альбомы |
| Library | `/library` | MainLayout | Сохранённые альбомы + любимые треки |
| Album | `/albums/:id` | MainLayout | Треки альбома; кнопки ♥ для альбома и треков |
| Admin | `/admin` | — | Админ-панель (отдельный layout) |
| 404 | `*` | MainLayout | Страница не найдена |

### Zustand Stores

| Store | Назначение |
|-------|-----------|
| `useAuthStore` | Аутентификация, токены, пользователь |
| `usePlayerStore` | Плеер: очередь, воспроизведение, прогресс, громкость |
| `useMusicStore` | Музыка: альбомы, треки, поиск, CRUD операции, загрузка файлов |
| `useArtistStore` | Выбранный исполнитель, открытие/закрытие панели |
| `useLibraryStore` | Сохранённые альбомы и любимые треки (persist → localStorage) |

### useMusicStore — операции

```typescript
fetchAlbums()          // загрузить все альбомы
createAlbum(data)      // создать альбом (admin)
updateAlbum(id, data)  // обновить альбом (admin)
deleteAlbum(id)        // удалить альбом (admin)
createSong(data)       // создать трек (admin)
updateSong(id, data)   // обновить трек (admin)
deleteSong(id)         // удалить трек (admin)
uploadImage(file)      // загрузить изображение → URL
uploadAudio(file)      // загрузить аудио → URL
```

### Axios и прокси

- `baseURL: "/api"` — все запросы идут через Nginx (production) или Vite proxy (dev)
- Bearer token добавляется через `interceptors.request`
- Автообновление токена через `interceptors.response` при 401

### Дизайн

| Цвет | HEX | Применение |
|------|-----|-----------|
| Spotify Green | #1DB954 | Кнопки Play, акценты |
| Black | #121212 | Основной фон |
| Charcoal | #181818 | Карточки, sidebar |
| Text Muted | #b3b3b3 | Второстепенный текст |

- Шрифт: **Plus Jakarta Sans** (аналог Spotify Circular)
- Кастомный скроллбар в стиле Spotify
- Плавные переходы между страницами

---

## Конфигурация

### Переменные окружения (`.env`)

| Переменная | По умолчанию | Описание |
|-----------|-------------|---------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/spotify_clone` | Подключение к БД |
| `SECRET_KEY` | случайный | Ключ для подписи JWT |
| `ALGORITHM` | `HS256` | Алгоритм JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Время жизни access token |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Время жизни refresh token |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Разрешённые origins |
| `ADMIN_EMAILS` | `test@example.com` | Email-адреса администраторов |
| `RECOMMENDATION_CACHE_TTL` | `300` | Кэш рекомендаций (сек) |

---

## Docker и деплой

### Контейнеры

| Контейнер | Образ | Порт | Назначение |
|-----------|-------|------|-----------|
| `spotify_postgres` | postgres:16-alpine | 5432 | База данных |
| `spotify_backend` | python:3.11-slim | 8000 | FastAPI |
| `spotify_frontend` | nginx:alpine | 3000→80 | React + Nginx |

### Volumes

| Volume | Назначение |
|--------|-----------|
| `postgres_data` | Данные PostgreSQL |
| `media_data` | Загруженные медиафайлы |

### Пересборка

```powershell
docker-compose up -d --build           # пересобрать всё
docker-compose up -d --build frontend  # только frontend
docker-compose logs -f backend         # логи backend
docker-compose down                    # остановить
docker-compose down -v                 # остановить + удалить volumes (БД!)
```

---

## История изменений

### 13.03.2026 (сессия 2) — Поиск, Your Library, кнопки ♥

**Новые функции:**
- **Поиск переработан** (`SearchPage.tsx`): локальный `isSearching` вместо глобального `isLoading`, debounce 400 мс, начальный экран отображает все альбомы
- **Поиск по album_name** (`search.py`): треки теперь ищутся в т.ч. по названию альбома
- **useLibraryStore** — новый Zustand store с `persist` (localStorage): `savedAlbums`, `likedSongs`, методы `saveAlbum/removeAlbum/isAlbumSaved`, `likeSong/unlikeSong/isSongLiked`
- **Your Library** (`LibraryPage.tsx`): вкладки «Albums» (сохранённые, клик → страница альбома) и «Liked Songs» (любимые треки)
- **Кнопка ♥ на AlbumPage**: сохранение альбома целиком и каждого трека по отдельности
- **Кнопка ♥ на SectionGrid** (главная): появляется при наведении на карточку трека
- **Кнопка ♥ в SearchPage**: у каждого трека в результатах поиска

**Исправления:**
- `search.py`: добавлен `@router.get("")` — устранён 307-редирект на внутренний Docker-адрес
- `SearchPage.tsx`: URL `/search/` (со слэшем) + прямой вызов `axiosInstance` без глобального `isLoading`

---

### 13.03.2026 (сессия 1) — Исправление критических багов

**Баги:**
- Кнопки в диалогах не работали — `FileOrUrlInput` определён внутри компонента вызывал размонтирование при каждом рендере
- Трек не создавался — `POST /songs` без слэша вызывал 307 Redirect на внутренний Docker-адрес
- Аудио не воспроизводилось — Nginx кэшировал `*.mp3` из статики, не проксируя на backend

**Исправления:**
- `FileOrUrlInput` вынесен за пределы `AdminPage`
- `useMusicStore`: `POST /songs/` (со слэшем)
- `songs.py`: добавлен `@router.post("")` (двойной роут)
- `nginx.conf`: удалён `mp3` из regex-правила кэширования
- `AdminPage` вынесена из `MainLayout` в отдельный роут

### 12.03.2026 — Админ-панель (полная реализация)

**Backend:**
- `app/routes/upload.py` — загрузка изображений и аудио
- `app/routes/albums.py` — CRUD для альбомов (PUT, DELETE)
- `app/routes/songs.py` — CRUD для треков (PUT, DELETE)
- Docker volume `media_data` для хранения файлов
- `nginx.conf`: `client_max_body_size 100M`, проксирование `/media`

**Frontend:**
- `useMusicStore`: `createAlbum`, `updateAlbum`, `deleteAlbum`, `createSong`, `updateSong`, `deleteSong`, `uploadImage`, `uploadAudio`
- `AdminPage.tsx`: полный интерфейс с диалогами, валидацией, toast-уведомлениями

### 11.03.2026 — Рефакторинг и стабилизация

- Автообновление JWT при 401 (axios interceptor)
- Панель «Об исполнителе» вместо чата
- OAuth удалён, только email + пароль
- Docker Compose с полной конфигурацией

---

### 16.03.2026 — Режимы Shuffle и Repeat в плеере

**Проблема:**
Кнопки «Перемешать» (Shuffle) и «Повторить» (Repeat) в панели управления плеером существовали только как визуальные элементы — они меняли иконку и цвет, но не влияли на логику воспроизведения. Состояние хранилось локально в `PlaybackControls.tsx` и не было связано со стором.

---

#### Shuffle (случайное воспроизведение)

**Алгоритм:** алгоритм Фишера-Йейтса — при включении Shuffle очередь **перемешивается заранее** и сохраняется в `shuffledQueue`. Воспроизведение идёт последовательно по `shuffledQueue`, что гарантирует **отсутствие повторов** до тех пор, пока не проиграют все треки.

**Изменения в `usePlayerStore.ts`:**
- Добавлена вспомогательная функция `fisherYates<T>(arr)` — перемешивает массив «на копии», не мутируя исходный
- Новые поля стора: `isShuffled: boolean`, `shuffledQueue: Song[]`, `shuffledIndex: number`
- `toggleShuffle()`:
  - **Включение:** текущий трек ставится первым, остаток очереди перемешивается через `fisherYates`. Результат записывается в `shuffledQueue`, позиция `shuffledIndex = 0`
  - **Выключение:** `shuffledQueue` и `shuffledIndex` сбрасываются, воспроизведение возвращается к линейному `currentIndex`
- `playNext()` в режиме Shuffle: двигается по `shuffledIndex + 1` в `shuffledQueue`; при конце списка и `repeatMode === "all"` — очередь **перемешивается заново** и начинается с первого трека нового списка; иначе — остановка
- `playPrevious()` в режиме Shuffle: двигается по `shuffledIndex - 1` в `shuffledQueue` (навигация по истории прослушивания)
- `playAlbum()`: если Shuffle включён в момент запуска альбома/плейлиста — сразу генерирует `shuffledQueue` для новой очереди
- `setCurrentSong()`: при ручном выборе трека находит его позицию в `shuffledQueue` и синхронизирует `shuffledIndex`

---

#### Repeat (повтор воспроизведения)

**Три режима (переключение Off → All → One → Off):**

| Режим | Поведение |
|---|---|
| **Off** | По окончании последнего трека — остановка |
| **Repeat All** | По окончании последнего трека — переход к первому; в режиме Shuffle — пересортировка и новый цикл |
| **Repeat One** | По окончании трека — перезапуск того же трека без обращения к стору |

**Изменения:**
- `usePlayerStore.ts`: поле `repeatMode: "off" | "all" | "one"`, метод `toggleRepeat()` (off → all → one → off); `playNext()` при `repeatMode === "one"` ничего не делает (ранний выход `return`)
- `AudioPlayer.tsx`: в `handleEnded` — если `repeatMode === "one"`, то `audioRef.current.currentTime = 0` + `play()` напрямую на `<audio>` элементе, не трогая стор; иначе — `playNext()`

---

#### Обновления UI

- `PlaybackControls.tsx`: удалены локальные `useState` для `isShuffled`, `repeatMode` и функция `toggleRepeat()`; кнопки Shuffle/Repeat теперь читают состояние и вызывают методы из `usePlayerStore`
- Кнопка Shuffle подсвечивается зелёным (`text-spotify-green`) при `isShuffled === true`
- Кнопка Repeat подсвечивается зелёным при `repeatMode !== "off"`, иконка меняется на `<Repeat1>` при `repeatMode === "one"`

---

*Документация актуальна на 16.03.2026*
