# Гайд для студента: Spotify Clone

Пошаговое руководство по работе с проектом Spotify Clone — от запуска до изучения архитектуры.

---

## Оглавление

1. [Быстрый старт](#быстрый-старт)
2. [Подготовка окружения](#подготовка-окружения)
3. [Запуск проекта](#запуск-проекта)
4. [Структура проекта](#структура-проекта)
5. [Работа с API](#работа-с-api)
6. [Разработка Backend](#разработка-backend)
7. [Разработка Frontend](#разработка-frontend)
8. [Полезные команды](#полезные-команды)
9. [Частые проблемы](#частые-проблемы)
10. [Контрольные вопросы](#контрольные-вопросы)

---

## Быстрый старт

Если нужно **просто запустить проект** и посмотреть, как он работает:

### 1. Запустить PostgreSQL

```powershell
cd D:\Spotify_copy
docker-compose up -d postgres
```

### 2. Настроить и запустить Backend

```powershell
# Создать .env (скопировать из .env.example)
copy .env.example .env

# Установить зависимости
pip install -r requirements.txt

# Применить миграции
python -m alembic upgrade head

# Запустить сервер
python -m uvicorn app.main:app --reload
```

### 3. Запустить Frontend

В **новом терминале**:

```powershell
cd D:\Spotify_copy\frontend
npm install
npm run dev
```

### 4. Открыть в браузере

- **Приложение:** http://localhost:3000
- **API документация:** http://localhost:8000/docs

### 5. Наполнить тестовыми данными (опционально)

После регистрации выполните:

```
POST http://localhost:8000/api/seed
```

Или через Swagger UI: http://localhost:8000/docs → Seed → POST /api/seed → Try it out → Execute

---

## Подготовка окружения

### Что нужно установить

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| Python | 3.10+ | Backend |
| Node.js | 20.19+ или 22.12+ | Frontend |
| PostgreSQL | 16 | База данных |
| Docker | latest | Запуск PostgreSQL (опционально) |
| Git | latest | Версионирование |

### Проверка установки

```powershell
python --version    # Python 3.10.x или выше
node --version     # v20.19.x или v22.12.x
npm --version
docker --version   # если используете Docker
```

---

## Запуск проекта

### Вариант A: Локальный запуск (рекомендуется для разработки)

| Шаг | Действие | Команда |
|-----|----------|---------|
| 1 | Запустить PostgreSQL | `docker-compose up -d postgres` |
| 2 | Создать .env | Скопировать из .env.example |
| 3 | Установить Python-зависимости | `pip install -r requirements.txt` |
| 4 | Применить миграции | `python -m alembic upgrade head` |
| 5 | Запустить Backend | `.\run.ps1` или `python -m uvicorn app.main:app --reload` |
| 6 | В новом терминале: установить npm-зависимости | `cd frontend && npm install` |
| 7 | Запустить Frontend | `npm run dev` |

### Вариант B: Полный Docker (всё в контейнерах)

```powershell
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Порты

| Сервис | Порт | URL |
|--------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |

---

## Структура проекта

### Backend (папка `app/`)

```
app/
├── main.py           # Точка входа FastAPI
├── config.py         # Конфигурация из .env
├── database.py       # Подключение к БД
├── dependencies.py   # get_current_user_id для защищённых routes
├── utils.py          # Хеширование паролей, JWT
├── schemas.py        # Pydantic-схемы для API
├── models/           # ORM-модели (таблицы БД)
└── routes/           # API endpoints
    ├── auth.py       # /api/auth - регистрация, вход
    ├── songs.py      # /api/songs - треки
    ├── albums.py     # /api/albums - альбомы
    ├── playlists.py  # /api/playlists - плейлисты
    ├── search.py     # /api/search - поиск
    ├── users.py      # /api/users - пользователи
    ├── seed.py       # /api/seed - тестовые данные
    └── websocket.py  # WebSocket - чат, активность
```

### Frontend (папка `frontend/src/`)

```
src/
├── App.tsx           # Роутинг
├── main.tsx         # Точка входа
├── pages/           # Страницы
│   ├── home/        # Главная
│   ├── search/      # Поиск
│   ├── library/     # Your Library
│   ├── album/       # Страница альбома
│   ├── chat/        # Чат
│   ├── admin/       # Админ-панель
│   └── login/       # Вход/регистрация
├── layout/          # MainLayout, Sidebar, Player
├── stores/          # Zustand (auth, player, music, chat)
├── components/      # UI-компоненты
├── providers/       # AuthProvider
├── lib/             # axios, utils
└── types/           # TypeScript типы
```

---

## Работа с API

### Документация

- **Swagger UI:** http://localhost:8000/docs — интерактивная документация
- **ReDoc:** http://localhost:8000/redoc — альтернативный вид

### Основные endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET | /api/songs/featured | Избранные треки |
| GET | /api/albums | Все альбомы |
| GET | /api/search?q=rock | Поиск |
| GET | /api/playlists/me | Мои плейлисты (нужен Bearer token) |
| POST | /api/seed | Наполнить БД тестовыми данными |

### Пример: регистрация через curl

```powershell
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@mail.com","password":"123456","username":"testuser"}'
```

### Пример: поиск

```
GET http://localhost:8000/api/search?q=rock
```

---

## Разработка Backend

### Создание новой миграции

```powershell
# Убедитесь, что PostgreSQL запущен
python -m alembic revision --autogenerate -m "add_new_table"

# Применить
python -m alembic upgrade head
```

### Добавление нового endpoint

1. Создать или дополнить файл в `app/routes/`
2. Добавить router в `app/main.py`:

```python
from app.routes import my_router
app.include_router(my_router.router, prefix="/api/my", tags=["My"])
```

### Защищённый endpoint (требует авторизации)

```python
from app.dependencies import get_current_user_id

@router.get("/me")
def get_my_data(user_id: UUID = Depends(get_current_user_id)):
    # user_id — ID текущего пользователя из JWT
    ...
```

### Форматирование кода (PEP8)

```powershell
pip install -r requirements-dev.txt
autopep8 app/
```

Или настроено в VS Code: форматирование при сохранении.

---

## Разработка Frontend

### Добавление новой страницы

1. Создать компонент в `frontend/src/pages/my-page/MyPage.tsx`
2. Добавить роут в `App.tsx`:

```tsx
<Route path="/my-page" element={<MyPage />} />
```

3. Добавить ссылку в `LeftSidebar.tsx` (если нужна в навигации)

### Работа со stores (Zustand)

```tsx
import { useMusicStore } from "@/stores/useMusicStore";

const { albums, fetchAlbums } = useMusicStore();

useEffect(() => {
  fetchAlbums();
}, [fetchAlbums]);
```

### API-запросы

Все запросы идут через `axiosInstance` из `lib/axios.ts`.  
Bearer token добавляется автоматически из localStorage.

---

## Полезные команды

### Backend

| Команда | Описание |
|---------|----------|
| `.\run.ps1` | Запуск FastAPI |
| `.\migrate.ps1` | Применить миграции |
| `python -m alembic current` | Текущая версия миграций |
| `python -m alembic history` | История миграций |

### Frontend

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера |
| `npm run build` | Сборка для production |
| `npm run preview` | Просмотр собранного приложения |

### Docker

| Команда | Описание |
|---------|----------|
| `docker-compose up -d postgres` | Запустить только PostgreSQL |
| `docker-compose up --build` | Запустить всё |
| `docker-compose down` | Остановить контейнеры |

---

## Частые проблемы

### Backend не запускается

**Ошибка:** `ModuleNotFoundError: No module named 'email_validator'`

```powershell
pip install 'pydantic[email]'
# или
pip install email-validator
```

**Ошибка:** подключение к БД

- Проверьте, что PostgreSQL запущен: `docker-compose up -d postgres`
- Проверьте `DATABASE_URL` в `.env`

### Frontend не подключается к API

- Убедитесь, что Backend запущен на порту 8000
- Vite проксирует `/api` на `http://localhost:8000` — проверьте `vite.config.ts`

### CORS ошибки

Добавьте в `.env`:

```
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Порт 3000 занят

Frontend автоматически переключится на 3001. Проверьте вывод в консоли.

---

## Контрольные вопросы

1. Зачем нужен ORM и чем он отличается от чистого SQL?
2. Что такое миграция и зачем она нужна?
3. Почему пароли и URL БД хранят в .env, а не в коде?
4. Что делает `Depends(get_db)` в FastAPI?
5. В каком порядке создавать таблицы с внешними ключами?
6. Почему playlists ссылаются на user_profiles, а не на auth_users?
7. Как работает JWT аутентификация в проекте?
8. Для чего нужен WebSocket и какие события он обрабатывает?

---

## Дополнительные материалы

- **Полная документация:** [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Схема БД:** [database/SCHEMA_SPEC.md](./database/SCHEMA_SPEC.md)
- **FastAPI:** https://fastapi.tiangolo.com/
- **React:** https://react.dev/
- **Zustand:** https://github.com/pmndrs/zustand

---

*Гайд для студентов. Spotify Clone, 2026.*
