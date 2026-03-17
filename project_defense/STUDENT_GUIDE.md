# Гайд для студента: Spotify Clone

Пошаговое руководство по работе с проектом — от запуска до изучения архитектуры.

---

## Оглавление

1. [Быстрый старт](#быстрый-старт)
2. [Что нужно установить](#что-нужно-установить)
3. [Запуск проекта](#запуск-проекта)
4. [Что я вижу в приложении](#что-я-вижу-в-приложении)
5. [Структура проекта](#структура-проекта)
6. [Как устроен Backend](#как-устроен-backend)
7. [Как устроен Frontend](#как-устроен-frontend)
8. [Работа с API](#работа-с-api)
9. [Миграции базы данных](#миграции-базы-данных)
10. [Как работает аутентификация](#как-работает-аутентификация)
11. [Как работает загрузка файлов](#как-работает-загрузка-файлов)
12. [Админ-панель](#админ-панель)
13. [Полезные команды](#полезные-команды)
14. [Частые проблемы и решения](#частые-проблемы-и-решения)
15. [Контрольные вопросы](#контрольные-вопросы)

---

## Быстрый старт

### Самый простой способ — Docker

**Требуется:** Docker Desktop (скачать с https://docker.com)

```powershell
cd D:\Spotify_copy
docker-compose up -d --build
```

Подождать 1–2 минуты, затем:

```powershell
# Наполнить базу данных тестовыми данными
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed" -Method POST
```

Открыть в браузере: http://localhost:3000

**Войти:** `test@example.com` / `test123`

**Остановить проект:**
```powershell
docker-compose down
```

---

## Что нужно установить

| Инструмент | Зачем | Скачать |
|-----------|-------|---------|
| Docker Desktop | Запуск всего проекта одной командой | https://docker.com |
| Python 3.10+ | Для локальной разработки backend | https://python.org |
| Node.js 20.19+ или 22.12+ | Для локальной разработки frontend | https://nodejs.org |
| Git | Версионирование кода | https://git-scm.com |
| VS Code | Редактор кода | https://code.visualstudio.com |

**Проверка установки:**
```powershell
python --version   # Python 3.10.x или выше
node --version     # v20.19.x или v22.x
docker --version   # Docker version 24.x
```

---

## Запуск проекта

### Вариант 1: Docker (всё в одной команде)

```powershell
docker-compose up -d --build
```

| Сервис | Адрес |
|--------|-------|
| Сайт (frontend) | http://localhost:3000 |
| API (backend) | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

### Вариант 2: Локальный запуск (для разработки)

Открыть **три** терминала:

**Терминал 1 — База данных:**
```powershell
cd D:\Spotify_copy
docker-compose up -d postgres
```

**Терминал 2 — Backend:**
```powershell
cd D:\Spotify_copy
copy .env.example .env
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

**Терминал 3 — Frontend:**
```powershell
cd D:\Spotify_copy\frontend
npm install
npm run dev
```

Затем выполнить seed (тестовые данные):
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed" -Method POST
```

---

## Что я вижу в приложении

После входа с `test@example.com` / `test123`:

| Страница | Путь | Что здесь |
|---------|------|----------|
| Главная | `/` | Три секции треков: Featured, Made For You, Trending. Кнопки ♥ на карточках. |
| Поиск | `/search` | Поиск треков/альбомов/артистов. На начальном экране — все альбомы. |
| Your Library | `/library` | Сохранённые альбомы и любимые треки |
| Альбом | `/albums/:id` | Треки конкретного альбома. Кнопка ♥ для альбома и каждого трека. |
| **Админ-панель** | `/admin` | Управление контентом |

**Плеер** всегда внизу — play/pause, перемотка, громкость.

**Панель «Исполнитель»** — нажмите на имя артиста в плеере или на треке.

**Кнопка ♥** — появляется при наведении на трек/альбом. Сохраняет в Your Library (данные хранятся в браузере).

---

## Структура проекта

```
Spotify_copy/
├── app/              ← Backend (Python/FastAPI)
│   ├── models/       ← Таблицы базы данных (ORM)
│   ├── routes/       ← API endpoints
│   ├── schemas.py    ← Что принимает/возвращает API
│   ├── main.py       ← Точка входа
│   └── database.py   ← Подключение к PostgreSQL
│
├── frontend/         ← Frontend (React/TypeScript)
│   └── src/
│       ├── pages/    ← Страницы приложения
│       ├── stores/   ← Состояние приложения (Zustand)
│       ├── layout/   ← Шаблон страниц (sidebar, плеер)
│       └── lib/      ← axios (HTTP-клиент)
│
├── alembic/          ← Миграции базы данных
├── media/            ← Загруженные файлы (обложки, аудио)
├── docker-compose.yml
└── .env.example      ← Шаблон конфигурации
```

---

## Как устроен Backend

### Стек технологий

- **FastAPI** — веб-фреймворк (аналог Django, но быстрее и современнее)
- **SQLAlchemy** — ORM (работа с БД через Python-классы вместо SQL)
- **Alembic** — миграции (версионирование структуры БД)
- **PostgreSQL** — реляционная база данных
- **Pydantic** — валидация данных
- **bcrypt** — хеширование паролей
- **python-jose** — JWT токены

### Как добавить новый endpoint

1. Открыть файл в `app/routes/` (например, `songs.py`)
2. Написать функцию с декоратором:

```python
@router.get("/{track_id}", response_model=TrackResponse)
def get_song(track_id: UUID, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Not found")
    return track
```

3. Если endpoint требует авторизации — добавить зависимость:

```python
@router.post("/")
def create_song(
    data: TrackCreate,
    user_id: UUID = Depends(get_current_user_id),   # любой авторизованный
    db: Session = Depends(get_db)
):
    ...
```

4. Для admin-только:

```python
@router.delete("/{id}")
def delete_song(
    id: UUID,
    _: UUID = Depends(get_admin_user_id),   # только admin
    db: Session = Depends(get_db)
):
    ...
```

### Схемы данных (Pydantic)

Все схемы в `app/schemas.py`. Пример:

```python
class AlbumCreate(BaseModel):
    title: str
    artist: str
    image_url: str
    release_year: int

class AlbumResponse(AlbumBase):
    id: UUID
    created_at: datetime
    songs: list[TrackResponse] = []

    class Config:
        from_attributes = True  # разрешает создание из ORM-объекта
```

---

## Как устроен Frontend

### Стек технологий

- **React 19** + **TypeScript** — UI
- **Vite** — сборщик (быстрее Webpack)
- **React Router 7** — роутинг (переход между страницами)
- **Zustand** — управление состоянием (аналог Redux, но проще)
- **Tailwind CSS** — стили
- **Radix UI** — готовые UI-компоненты (Dialog, ScrollArea, Slider...)
- **Axios** — HTTP-запросы
- **react-hot-toast** — уведомления

### Zustand — управление состоянием

Данные приложения хранятся в stores:

```typescript
// Использование store в компоненте
import { useMusicStore } from "@/stores/useMusicStore";

const MyComponent = () => {
    const { albums, fetchAlbums, createAlbum } = useMusicStore();

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    return <div>{albums.map(a => <p>{a.title}</p>)}</div>;
};
```

| Store | Что хранит |
|-------|-----------|
| `useAuthStore` | Пользователь, токены, статус авторизации |
| `usePlayerStore` | Текущий трек, очередь, громкость, прогресс |
| `useMusicStore` | Альбомы, треки, результаты поиска, ошибки |
| `useArtistStore` | Выбранный артист, открыта ли панель |
| `useLibraryStore` | Сохранённые альбомы + любимые треки (persist → localStorage) |

### useLibraryStore — работа с библиотекой

```typescript
import { useLibraryStore } from "@/stores/useLibraryStore";

const { saveAlbum, removeAlbum, isAlbumSaved, likeSong, unlikeSong, isSongLiked } = useLibraryStore();

// Сохранить альбом в библиотеку
saveAlbum(album);

// Проверить, сохранён ли альбом
if (isAlbumSaved(album.id)) { ... }

// Убрать из библиотеки
removeAlbum(album.id);

// Аналогично для треков
likeSong(song);
isSongLiked(song.id);
unlikeSong(song.id);
```

Данные сохраняются в `localStorage` под ключом `spotify-library` — не теряются при обновлении страницы.

### Axios — HTTP-запросы

Все запросы через `axiosInstance` из `lib/axios.ts`:

```typescript
import { axiosInstance } from "@/lib/axios";

// GET
const response = await axiosInstance.get("/albums");

// POST с данными
const response = await axiosInstance.post("/albums", {
    title: "My Album",
    artist: "Me",
    image_url: "https://...",
    release_year: 2024
});

// POST с файлом
const formData = new FormData();
formData.append("file", file, file.name);
const response = await axiosInstance.post("/upload/image", formData);
```

Bearer token добавляется автоматически из localStorage.

### Роутинг

В `App.tsx` определены все маршруты:

```tsx
<Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<MainLayout />}>     {/* с sidebar и плеером */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/albums/:id" element={<AlbumPage />} />
    </Route>
    <Route path="/admin" element={<AdminPage />} />  {/* без sidebar */}
</Routes>
```

---

## Работа с API

### Swagger UI

Откройте http://localhost:8000/docs — интерактивная документация. Там можно:
- Посмотреть все endpoints
- Попробовать запросы прямо в браузере
- Увидеть схемы запросов и ответов

### Примеры запросов

**Регистрация:**
```powershell
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"user@test.com","password":"pass123","username":"myuser"}'
```

**Вход:**
```powershell
curl -X POST http://localhost:8000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123"}'
```

**Получить альбомы:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/albums" -Method GET
```

**Создать альбом (нужен Bearer token):**
```powershell
$token = "ваш_token_из_login"
Invoke-RestMethod -Uri "http://localhost:8000/api/albums" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"title":"My Album","artist":"Me","image_url":"https://picsum.photos/300","release_year":2024}'
```

**Поиск:**
```
GET http://localhost:8000/api/search?q=rock
```

---

## Миграции базы данных

**Миграция** — версия структуры базы данных. Alembic хранит историю изменений.

### Как это работает

```
Версия 001 → Версия 002 → Версия 003 (текущая)
(auth_users)  (+ albums)   (FK исправлен)
```

### Команды

```powershell
# Посмотреть текущую версию
python -m alembic current

# Применить все миграции
python -m alembic upgrade head

# Откатить последнюю
python -m alembic downgrade -1

# Создать новую миграцию после изменения модели
python -m alembic revision --autogenerate -m "add_column_likes"
```

### Как добавить новое поле в таблицу

1. Добавить поле в ORM-модель (`app/models/*.py`):
```python
likes_count = Column(Integer, default=0)
```

2. Создать миграцию:
```powershell
python -m alembic revision --autogenerate -m "add_likes_count"
```

3. Применить:
```powershell
python -m alembic upgrade head
```

---

## Как работает аутентификация

### Схема JWT

```
1. POST /api/auth/login → { access_token, refresh_token, user }
2. Сохранить токены в localStorage
3. Каждый запрос: Authorization: Bearer <access_token>
4. Через 30 минут access_token истекает
5. При 401: автоматически POST /api/auth/refresh → новый access_token
6. Повторить исходный запрос
```

### Где хранятся токены

В `localStorage` браузера под ключом `spotify_tokens`:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

### Как проверить права администратора

В `app/dependencies.py`:

```python
def get_admin_user_id(user_id, db):
    user = db.query(AuthUser).filter(AuthUser.id == user_id).first()
    if user.email.lower() not in ADMIN_EMAILS:
        raise HTTPException(403, "Admin access required")
    return user_id
```

`ADMIN_EMAILS` берётся из переменной окружения `ADMIN_EMAILS`.

---

## Как работает загрузка файлов

### Цепочка запросов

```
1. Пользователь выбирает файл в браузере
2. Frontend: POST /api/upload/image (multipart/form-data)
3. Backend (upload.py): сохраняет в /app/media/images/
4. Backend возвращает: {"url": "/media/images/uuid.jpg"}
5. Frontend использует URL при создании альбома/трека
6. При отображении: GET /media/images/uuid.jpg
7. Nginx проксирует на backend
8. Backend (StaticFiles): отдаёт файл из /app/media/
```

### Почему файлы не теряются при перезапуске

В `docker-compose.yml` настроен volume:
```yaml
volumes:
  - media_data:/app/media
```

`media_data` — отдельный Docker volume, который не удаляется при `docker-compose down` (только при `docker-compose down -v`).

---

## Админ-панель

Подробная документация: [ADMIN_PANEL.md](./ADMIN_PANEL.md)

### Краткий обзор

**Адрес:** http://localhost:3000/admin (кнопка **Admin** в шапке)

**Что умеет:**
- Создавать альбомы с обложкой (файл или URL)
- Добавлять треки (обложка + аудиофайл или URL)
- Редактировать и удалять альбомы и треки
- Видеть список всех альбомов с раскрытием треков

**Кто может использовать:**
Только пользователи с email в переменной `ADMIN_EMAILS`. По умолчанию: `test@example.com`.

### Технический момент для разработчиков

> **Важно:** При создании компонентов в React — никогда не определяйте дочерние компоненты **внутри** родительского функционального компонента. Это приводит к их пересозданию при каждом рендере.

**Неправильно:**
```tsx
const ParentPage = () => {
    // ❌ React пересоздаёт MyInput при каждом рендере
    // ❌ Поля ввода сбрасываются, файлы не выбираются
    const MyInput = ({ value, onChange }) => (
        <input value={value} onChange={onChange} />
    );
    return <MyInput ... />;
};
```

**Правильно:**
```tsx
// ✅ Компонент определён на уровне модуля — тип стабилен
const MyInput = ({ value, onChange }) => (
    <input value={value} onChange={onChange} />
);

const ParentPage = () => {
    return <MyInput ... />;
};
```

---

## Полезные команды

### Docker

```powershell
docker-compose up -d --build          # запустить/пересобрать всё
docker-compose up -d --build frontend # пересобрать только frontend
docker-compose ps                     # статус контейнеров
docker-compose logs -f backend        # логи backend (в реальном времени)
docker-compose logs -f frontend       # логи nginx
docker-compose down                   # остановить (данные сохраняются)
docker-compose down -v                # остановить + удалить все данные
```

### Backend

```powershell
# Запуск с авто-перезагрузкой
python -m uvicorn app.main:app --reload

# Миграции
python -m alembic upgrade head
python -m alembic current
python -m alembic revision --autogenerate -m "описание"

# Seed
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed" -Method POST
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed?force=true" -Method POST
```

### Frontend

```powershell
npm run dev       # запуск dev-сервера (с HMR)
npm run build     # сборка для production
npm run preview   # предпросмотр production-сборки
```

---

## Частые проблемы и решения

### Проект не запускается

**Ошибка: PostgreSQL не запущен**
```powershell
# Решение: запустить только БД
docker-compose up -d postgres
# Подождать 5-10 секунд, затем запустить backend
```

**Ошибка: порт 3000 занят**
```
Frontend автоматически переключится на 3001, 3002...
Смотрите вывод `npm run dev` — там будет актуальный порт.
```

**Ошибка: `ModuleNotFoundError`**
```powershell
pip install -r requirements.txt
```

---

### Вход не работает

**Ошибка: 401 при входе**
```powershell
# Нужно выполнить seed (создаёт тестового пользователя)
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed" -Method POST
```

**Ошибка: 403 в Swagger (Forbidden)**

Убедитесь, что вы передаёте токен. В Swagger нажмите **Authorize** и вставьте `Bearer <token>`.

---

### Музыка не воспроизводится

**Треки загружены с внешних сервисов — нужен интернет.**

Если треки имеют пути `/media/songs/...` (старые данные из seed):
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/seed/seed?force=true" -Method POST
```

Если загружали свои mp3, но они не играют — возможно проблема с nginx. Проверьте:
- `nginx.conf` не должен кэшировать `.mp3` из статики

---

### Изменения в коде не применяются

**Backend (локально):** uvicorn с `--reload` автоматически перезапускается при изменении файлов.

**Frontend (локально):** Vite с HMR обновляет страницу автоматически.

**В Docker:** нужно пересобрать:
```powershell
docker-compose up -d --build
```

---

### CORS ошибки

Если видите ошибку вида `Access-Control-Allow-Origin`:
```
# В .env добавить свой порт
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

---

## Контрольные вопросы

**По архитектуре:**
1. Зачем нужен ORM (SQLAlchemy) — чем он удобнее чистого SQL?
2. Что такое миграция и почему нельзя просто изменить базу данных напрямую?
3. Почему пароли нельзя хранить в открытом виде? Что такое bcrypt?
4. Зачем два токена — access и refresh? Почему не один?
5. Что делает `Depends(get_db)` в FastAPI? Что такое Dependency Injection?

**По базе данных:**
6. Почему `album_name` дублируется в таблице tracks, хотя есть album_id? Что такое денормализация?
7. Почему playlists ссылаются на user_profiles, а не на auth_users?
8. Что происходит с треками при удалении альбома (`cascade="all, delete-orphan"`)?
9. Зачем нужен UNIQUE(playlist_id, position) в playlist_tracks?

**По frontend:**
10. Что такое Zustand? Чем он отличается от `useState`?
11. Зачем axios interceptor перехватывает ответы 401?
12. Почему компоненты нельзя определять внутри других функциональных компонентов? (Подсказка: React reconciliation)
13. Что такое `<Outlet />` в React Router?
14. Что такое `zustand/middleware` `persist`? Чем хранение в localStorage отличается от хранения в БД?
15. Зачем в SearchPage используется debounce? Что произойдёт, если убрать задержку 400 мс?
16. Почему поиск нельзя вызывать через общий `isLoading` из store, когда другие компоненты тоже делают запросы?

**По деплою:**
14. Зачем Nginx, если backend уже слушает на порту 8000?
15. Почему нельзя хранить медиафайлы прямо в контейнере без volume?
16. Что произойдёт, если выполнить `docker-compose down -v`?

---

## Дополнительные материалы

- **Полная документация:** [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Админ-панель:** [ADMIN_PANEL.md](./ADMIN_PANEL.md)
- **Схема БД:** [database/SCHEMA_SPEC.md](./database/SCHEMA_SPEC.md)
- **FastAPI:** https://fastapi.tiangolo.com/
- **SQLAlchemy:** https://docs.sqlalchemy.org/
- **React:** https://react.dev/
- **Zustand:** https://docs.pmnd.rs/zustand/
- **Tailwind CSS:** https://tailwindcss.com/docs

---

*Гайд для студентов. Spotify Clone. Обновлено 13.03.2026 (сессия 2)*
