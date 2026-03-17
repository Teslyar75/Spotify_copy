# Обзор технологий проекта Spotify Clone

Полное описание всех технологий, инструментов, папок и файлов проекта.

---

## Содержание

1. [Общая структура проекта](#1-общая-структура-проекта)
2. [Backend — FastAPI + Python](#2-backend--fastapi--python)
3. [База данных — PostgreSQL + SQLAlchemy + Alembic](#3-база-данных--postgresql--sqlalchemy--alembic)
4. [Frontend — React + TypeScript + Vite](#4-frontend--react--typescript--vite)
5. [Инфраструктура — Docker + Nginx](#5-инфраструктура--docker--nginx)
6. [Папки: кто и что создаёт](#6-папки-кто-и-что-создаёт)
7. [Файлы конфигурации](#7-файлы-конфигурации)
8. [Полный граф зависимостей](#8-полный-граф-зависимостей)

---

## 1. Общая структура проекта

```
D:\Spotify_copy\
│
├── app\                    ← Backend (FastAPI, Python)
├── alembic\                ← Миграции базы данных
├── frontend\               ← Frontend (React, TypeScript)
├── database\               ← SQL-схемы (документация)
├── media\                  ← Медиафайлы (изображения, аудио — локально)
├── scripts\                ← Вспомогательные скрипты
├── .venv\                  ← Виртуальное окружение Python
│
├── docker-compose.yml      ← Оркестрация контейнеров
├── Dockerfile.backend      ← Образ для backend
├── requirements.txt        ← Python-зависимости
├── alembic.ini             ← Настройки Alembic
├── seed.py                 ← Скрипт начального заполнения БД
├── .env                    ← Переменные окружения (секреты)
└── pyproject.toml          ← Метаданные Python-проекта
```

---

## 2. Backend — FastAPI + Python

### Что такое FastAPI

**FastAPI** — современный асинхронный веб-фреймворк для Python. Автоматически генерирует документацию API (Swagger UI по адресу `/docs`), поддерживает типизацию через Pydantic и работает через ASGI-сервер Uvicorn.

### Структура папки `app\`

```
app\
├── models\         ← ORM-модели (таблицы БД)
│   ├── auth_user.py        — таблица аккаунтов
│   ├── user_profile.py     — таблица профилей
│   ├── album.py            — таблица альбомов
│   ├── track.py            — таблица треков
│   ├── playlist.py         — таблица плейлистов
│   ├── playlist_track.py   — связь плейлист ↔ трек (many-to-many)
│   ├── listening_history.py — история прослушиваний
│   ├── message.py          — сообщения чата
│   ├── user_status.py      — онлайн-статус пользователя
│   └── __init__.py
│
├── routes\         ← API-эндпоинты (роутеры)
│   ├── auth.py             — регистрация, вход, выход
│   ├── songs.py            — треки (список, featured, trending)
│   ├── albums.py           — альбомы и их треки
│   ├── search.py           — поиск треков/альбомов/артистов
│   ├── upload.py           — загрузка медиафайлов
│   ├── playlists.py        — CRUD плейлистов
│   ├── users.py            — профили пользователей
│   ├── player.py           — история воспроизведения
│   ├── recommendations.py  — рекомендации треков
│   ├── seed.py             — эндпоинт для заполнения БД тестовыми данными
│   └── websocket.py        — WebSocket-чат
│
├── main.py         ← Точка входа FastAPI-приложения
├── config.py       ← Настройки (DATABASE_URL, SECRET_KEY и т.д.)
├── database.py     ← Подключение к PostgreSQL через SQLAlchemy
├── dependencies.py ← Зависимости FastAPI (get_db, get_current_user)
├── schemas.py      ← Pydantic-схемы (валидация запросов и ответов)
├── utils.py        ← Вспомогательные функции (хеширование паролей)
├── oauth.py        ← OAuth2 / JWT логика
└── websocket.py    ← WebSocket менеджер соединений
```

### Ключевые библиотеки Backend

| Библиотека | Версия | Назначение |
|-----------|--------|-----------|
| `fastapi` | 0.109+ | Веб-фреймворк, роутеры, зависимости |
| `uvicorn` | 0.27+ | ASGI-сервер для запуска FastAPI |
| `sqlalchemy` | 2.0+ | ORM — работа с БД через Python-объекты |
| `alembic` | 1.13+ | Миграции схемы базы данных |
| `pydantic` | 2.x | Валидация данных, схемы запросов/ответов |
| `python-jose` | 3.3+ | Генерация и проверка JWT-токенов |
| `bcrypt` | 4.0+ | Хеширование паролей |
| `python-multipart` | latest | Поддержка загрузки файлов (multipart/form-data) |
| `psycopg2-binary` | latest | Драйвер PostgreSQL для Python |
| `python-dotenv` | latest | Чтение переменных из файла `.env` |

### Как запускается Backend

```
Uvicorn → FastAPI app → SQLAlchemy → PostgreSQL
                     ↓
               Nginx ← /api/* запросы от браузера
```

---

## 3. База данных — PostgreSQL + SQLAlchemy + Alembic

### PostgreSQL

**PostgreSQL 16** — объектно-реляционная СУБД. В проекте запускается в Docker-контейнере. Данные хранятся в Docker Volume `spotify_postgres_data` — не теряются при перезапуске контейнера.

**Подключение:** через переменную `DATABASE_URL` в `.env`:
```
DATABASE_URL=postgresql://postgres:password@postgres:5432/spotify_db
```

### Таблицы базы данных

| Таблица | Назначение |
|---------|-----------|
| `auth_users` | Аккаунты: email + bcrypt-хеш пароля |
| `user_profiles` | Профили: username, аватар, bio |
| `albums` | Альбомы: название, исполнитель, обложка, год |
| `tracks` | Треки: название, исполнитель, длительность, файл, обложка, FK на альбом |
| `playlists` | Плейлисты: название, владелец |
| `playlist_tracks` | Связь многие-ко-многим: плейлист ↔ трек |
| `listening_history` | История прослушиваний пользователя |
| `messages` | Сообщения WebSocket-чата |
| `user_status` | Онлайн-статус пользователей |

### Alembic — миграции

**Alembic** — инструмент миграций для SQLAlchemy. Хранит историю изменений схемы БД в виде Python-файлов.

```
alembic\
├── versions\                   ← Файлы миграций (создаются командой alembic revision)
│   ├── 001_initial_schema.py   — создание auth_users, user_profiles
│   ├── 002_add_music_tables.py — добавление albums, tracks
│   ├── 003_fk_to_user_profiles.py — внешние ключи
│   ├── 004_add_initial_username.py — новое поле в auth_users
│   └── 6c885fc11b07_merge_heads.py — слияние веток миграций
├── env.py      ← Настройка окружения Alembic (читает DATABASE_URL)
├── script.py.mako ← Шаблон для генерации новых миграций
└── README      ← Краткая документация
```

**Команды Alembic:**
```bash
alembic upgrade head        # Применить все миграции
alembic revision --autogenerate -m "описание"  # Создать новую миграцию
alembic downgrade -1        # Откатить последнюю миграцию
alembic history             # История миграций
```

---

## 4. Frontend — React + TypeScript + Vite

### Что такое Vite

**Vite** — современный сборщик frontend-проектов. При разработке (`npm run dev`) запускает сервер с мгновенной горячей перезагрузкой (HMR). При сборке (`npm run build`) создаёт оптимизированные статические файлы в папку `dist\`.

### Структура папки `frontend\`

```
frontend\
│
├── src\                    ← Исходный код React-приложения
│   ├── pages\              ← Страницы приложения (по одной папке на маршрут)
│   │   ├── home\           — Главная страница (/)
│   │   │   ├── HomePage.tsx
│   │   │   └── components\
│   │   │       ├── FeaturedSection.tsx  — секция рекомендаций
│   │   │       └── SectionGrid.tsx      — сетка треков с кнопками ♥
│   │   ├── search\         — Поиск (/search)
│   │   │   └── SearchPage.tsx
│   │   ├── library\        — Библиотека (/library)
│   │   │   └── LibraryPage.tsx
│   │   ├── album\          — Страница альбома (/albums/:id)
│   │   │   └── AlbumPage.tsx
│   │   ├── admin\          — Админ-панель (/admin)
│   │   │   └── AdminPage.tsx
│   │   ├── login\          — Вход и регистрация (/login)
│   │   │   └── LoginPage.tsx
│   │   ├── AddPlaylist\    — Создание плейлиста (/playlists/new)
│   │   │   └── AddPlaylistPage.tsx
│   │   ├── playlistEditPage\ — Редактирование плейлиста (/playlists/:id/edit)
│   │   │   └── PlaylistEditPage.tsx
│   │   ├── presentation\   — Страница презентации проекта (/presentation)
│   │   │   └── PresentationPage.tsx
│   │   ├── chat\           — Чат (/chat)
│   │   └── 404\            — Страница ошибки
│   │       └── NotFoundPage.tsx
│   │
│   ├── layout\             ← Постоянная обёртка (видна на всех страницах)
│   │   ├── MainLayout.tsx          — корневой layout (левая панель + контент + плеер)
│   │   └── components\
│   │       ├── LeftSidebar.tsx     — левая панель (навигация, альбомы)
│   │       ├── PlaybackControls.tsx — плеер внизу (play/pause, прогресс, громкость)
│   │       ├── AudioPlayer.tsx     — HTML5 Audio логика
│   │       └── ArtistInfoSidebar.tsx — боковая панель «Об исполнителе»
│   │
│   ├── stores\             ← Zustand store'ы (глобальное состояние)
│   │   ├── useAuthStore.ts     — аутентификация, токены, пользователь
│   │   ├── usePlayerStore.ts   — плеер: очередь, текущий трек, громкость
│   │   ├── useMusicStore.ts    — альбомы, треки, CRUD, поиск
│   │   ├── useArtistStore.ts   — выбранный исполнитель, открыта ли панель
│   │   └── useLibraryStore.ts  — сохранённые альбомы + любимые треки (localStorage)
│   │
│   ├── components\         ← Переиспользуемые компоненты
│   │   ├── Topbar.tsx          — верхняя панель (навигация, аватар)
│   │   ├── ui\                 — базовые UI-компоненты (Radix UI + Tailwind)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── PlaylistCard.tsx     — карточка плейлиста
│   │   │   └── AddToPlayListModal.tsx — модальное окно добавления в плейлист
│   │   └── skeletons\
│   │       └── Skeleton.tsx    — анимированный скелетон загрузки
│   │
│   ├── lib\                ← Утилиты и конфигурация
│   │   ├── axios.ts        — настроенный axios с interceptor'ами (JWT, 401)
│   │   └── utils.ts        — утилиты (cn — классы Tailwind)
│   │
│   ├── providers\          ← React-провайдеры
│   │   └── AuthProvider.tsx — проверяет токен при загрузке приложения
│   │
│   ├── types\              ← TypeScript-типы
│   │   └── index.ts        — Song, Album, Playlist, User и другие типы
│   │
│   ├── App.tsx             ← Корневой компонент, определяет маршруты
│   ├── main.tsx            ← Точка входа React-приложения
│   ├── index.css           ← Глобальные стили + Tailwind directives
│   └── App.css             ← Базовые CSS-переменные
│
├── public\                 ← Статические файлы (копируются в dist as-is)
│   ├── album-header-bg.png     — фон шапки страницы альбома
│   ├── home-header-bg.png      — фон шапки главной страницы
│   ├── search-header-bg.png    — фон шапки страницы поиска
│   ├── library-header-bg.png   — фон шапки страницы библиотеки
│   ├── favicon.svg
│   └── media\              — локальные медиафайлы (для разработки без Docker)
│
├── package.json            ← Зависимости и скрипты npm
├── package-lock.json       ← Зафиксированные версии пакетов
├── tsconfig.json           ← Настройки TypeScript
├── vite.config.ts          ← Настройки сборщика Vite
├── tailwind.config.js      ← Настройки Tailwind CSS (цвета, шрифты)
├── postcss.config.js       ← PostCSS (нужен для Tailwind)
├── eslint.config.js        ← Правила линтера ESLint
├── nginx.conf              ← Конфигурация Nginx внутри контейнера
├── Dockerfile.frontend     ← Docker-образ фронтенда
├── index.html              ← HTML-шаблон (единственный HTML-файл SPA)
└── .env                    ← Переменные окружения фронтенда (VITE_API_URL)
```

### Ключевые библиотеки Frontend

| Библиотека | Версия | Назначение |
|-----------|--------|-----------|
| `react` | 19.x | UI-компоненты, хуки |
| `react-dom` | 19.x | Рендеринг React в DOM |
| `typescript` | 5.x | Типизация JavaScript |
| `vite` | 7.x | Сборщик, dev-сервер |
| `react-router-dom` | 7.x | Клиентская маршрутизация (SPA) |
| `zustand` | 5.x | Управление глобальным состоянием |
| `axios` | 1.x | HTTP-клиент для запросов к API |
| `tailwindcss` | 3.x | Utility-first CSS-фреймворк |
| `@radix-ui/*` | latest | Доступные UI-примитивы (слайдеры, диалоги и т.д.) |
| `lucide-react` | 0.577+ | Иконки (Play, Heart, Search и т.д.) |
| `react-hot-toast` | 2.x | Всплывающие уведомления |
| `socket.io-client` | 4.x | WebSocket-клиент для чата |
| `class-variance-authority` | 0.7+ | Варианты стилей для компонентов |
| `clsx` + `tailwind-merge` | latest | Умное объединение CSS-классов |
| `framer-motion` | 12.x | Анимации (dev-зависимость) |

---

## 5. Инфраструктура — Docker + Nginx

### Docker и Docker Compose

**Docker** — платформа контейнеризации. Каждый сервис запускается в изолированном контейнере с собственным окружением.

**Docker Compose** (`docker-compose.yml`) — описывает, как запустить несколько контейнеров вместе.

В проекте 3 контейнера:

| Контейнер | Образ | Назначение | Порт |
|-----------|-------|-----------|------|
| `spotify_postgres` | `postgres:16` | База данных | 5432 (внутренний) |
| `spotify_backend` | Dockerfile.backend | FastAPI + Uvicorn | 8000 (внутренний) |
| `spotify_frontend` | Dockerfile.frontend | React + Nginx | 3000 → 80 |

**Docker Volumes:**
- `spotify_postgres_data` — данные PostgreSQL (не удаляются при `docker compose down` без флага `-v`)

**Docker Networks:**
- `spotify_copy_default` — внутренняя сеть, контейнеры общаются по именам (`postgres`, `backend`, `frontend`)

### Nginx

**Nginx** работает внутри контейнера `spotify_frontend` как:

1. **Веб-сервер** — раздаёт статические файлы React (`dist\`)
2. **Reverse Proxy** — проксирует запросы `/api/*` и `/media/*` на backend (порт 8000)

```nginx
# nginx.conf — упрощённая схема
location /api/ {
    proxy_pass http://backend:8000;  # внутренняя Docker-сеть
}
location /media/ {
    proxy_pass http://backend:8000;
}
location / {
    try_files $uri /index.html;      # SPA — все маршруты отдают index.html
}
```

---

## 6. Папки: кто и что создаёт

### Создаются АВТОМАТИЧЕСКИ инструментами

| Папка | Кто создаёт | Когда |
|-------|------------|-------|
| `.venv\` | Python (`python -m venv .venv`) | При создании виртуального окружения |
| `frontend\node_modules\` | npm (`npm install` или `npm ci`) | При установке зависимостей |
| `frontend\dist\` | Vite (`npm run build`) | При сборке для production |
| `frontend\tsconfig.tsbuildinfo` | TypeScript (`tsc -b`) | При сборке (кеш компилятора) |
| `alembic\versions\*.py` | Alembic (`alembic revision --autogenerate`) | При создании новой миграции |
| `app\__pycache__\` | Python | При запуске (байткод .pyc) |
| `app\models\__pycache__\` | Python | При запуске |
| Docker Volume `spotify_postgres_data` | Docker Compose | При первом `docker compose up` |
| Docker сеть `spotify_copy_default` | Docker Compose | При первом `docker compose up` |
| `/media/songs/` (внутри контейнера) | FastAPI (`upload.py`) | При загрузке аудиофайлов через админ-панель |
| `/media/images/` (внутри контейнера) | FastAPI (`upload.py`) | При загрузке изображений через админ-панель |

### Создаются ВРУЧНУЮ разработчиком

| Папка / Файл | Кто создал | Назначение |
|-------------|-----------|-----------|
| `app\` | Разработчик | Весь backend-код |
| `app\models\` | Разработчик | ORM-модели таблиц |
| `app\routes\` | Разработчик | API-эндпоинты |
| `frontend\src\` | Разработчик | Весь frontend-код |
| `frontend\src\pages\` | Разработчик | Страницы приложения |
| `frontend\src\stores\` | Разработчик | Zustand store'ы |
| `frontend\src\components\` | Разработчик | Переиспользуемые компоненты |
| `frontend\src\layout\` | Разработчик | Layout-компоненты |
| `frontend\src\types\` | Разработчик | TypeScript-типы |
| `frontend\src\lib\` | Разработчик | Утилиты (axios, cn) |
| `frontend\public\` | Разработчик | Статика (картинки, иконки) |
| `alembic\` | Alembic init + разработчик | Конфигурация миграций |
| `database\` | Разработчик | SQL-схемы (документация) |
| `scripts\` | Разработчик | Скрипты инициализации |
| `media\` (локальная) | Разработчик | Медиафайлы для локального запуска |
| `.env` | Разработчик (из `.env.example`) | Секретные переменные окружения |

### Создаются при инициализации конкретного инструмента

| Команда | Что создаётся |
|---------|--------------|
| `npm create vite@latest frontend` | `frontend\`, `src\`, `public\`, `package.json`, `index.html`, `vite.config.ts` |
| `npm install` | `node_modules\`, `package-lock.json` |
| `npx tailwindcss init` | `tailwind.config.js`, `postcss.config.js` |
| `python -m venv .venv` | `.venv\` со всем содержимым |
| `alembic init alembic` | `alembic\`, `alembic.ini` |
| `alembic revision --autogenerate -m "name"` | `alembic\versions\xxxx_name.py` |
| `docker compose up` | Docker Volume, Docker Network, контейнеры |
| `npm run build` | `frontend\dist\` |

---

## 7. Файлы конфигурации

### Корень проекта

| Файл | Назначение |
|------|-----------|
| `docker-compose.yml` | Описание всех контейнеров, сетей, volume'ов |
| `Dockerfile.backend` | Инструкция сборки Docker-образа backend |
| `requirements.txt` | Production Python-зависимости |
| `requirements-dev.txt` | Dev Python-зависимости (линтеры, тесты) |
| `pyproject.toml` | Метаданные Python-проекта (для pip/poetry) |
| `alembic.ini` | Настройки Alembic (путь к миграциям, формат логов) |
| `.env` | Секреты: DATABASE_URL, SECRET_KEY, JWT настройки |
| `.env.example` | Шаблон .env без реальных значений (для новых разработчиков) |
| `.env.docker.example` | Шаблон .env для Docker-окружения |
| `.dockerignore` | Что НЕ копировать в Docker-образ (node_modules, .venv и т.д.) |
| `.gitignore` | Что НЕ добавлять в Git (секреты, кеш, node_modules) |
| `seed.py` | Скрипт заполнения БД тестовыми данными |
| `run.ps1` | PowerShell-скрипт локального запуска |
| `run-docker.ps1` | PowerShell-скрипт запуска через Docker |
| `migrate.ps1` | PowerShell-скрипт применения миграций |

### Frontend

| Файл | Назначение |
|------|-----------|
| `package.json` | Зависимости, скрипты (dev, build, lint) |
| `tsconfig.json` | Настройки TypeScript-компилятора |
| `vite.config.ts` | Настройки Vite (плагины, proxy для dev-сервера) |
| `tailwind.config.js` | Кастомные цвета Spotify (green, charcoal и т.д.) |
| `postcss.config.js` | PostCSS (обработка CSS для Tailwind) |
| `eslint.config.js` | Правила линтинга кода |
| `nginx.conf` | Конфигурация Nginx внутри Docker-контейнера |
| `Dockerfile.frontend` | Multi-stage сборка: Node (build) → Nginx (serve) |
| `index.html` | Единственный HTML-файл SPA (точка входа) |
| `.env` | `VITE_API_URL` и другие переменные фронтенда |

---

## 8. Полный граф зависимостей

```
Пользователь (браузер)
        │
        ▼
  Nginx :3000
   ├──── / ──────────────────── React SPA (dist/index.html)
   │                                   │
   │                            React Router
   │                                   │
   │              ┌────────────────────┼──────────────────┐
   │              │                    │                   │
   │           /search            /library            /albums/:id
   │              │                    │                   │
   │         SearchPage          LibraryPage          AlbumPage
   │              │                    │                   │
   │         useMusicStore       useLibraryStore      usePlayerStore
   │              │                    │                   │
   ├──── /api/* ──┼────────────────────┼───────────────────┤
   │              │                    │                   │
   │         FastAPI Backend (Uvicorn :8000)               │
   │              │                                        │
   │         SQLAlchemy ORM                                │
   │              │                                        │
   │         PostgreSQL :5432                              │
   │         (Docker Volume)                               │
   │                                                       │
   └──── /media/* ─────────────────────────────────────────┘
              │
        Загруженные файлы
        (MP3, изображения)
        в Docker Volume
```

---

*Документ подготовлен 14.03.2026. Проект: Spotify Clone (FastAPI + React + PostgreSQL + Docker)*
