# Backend Structure

**Изображение:** `backend-structure.png`

---

## Что изображено

Структура пакета `app/` — бэкенд-приложения на FastAPI.

- **main.py** — точка входа, создание FastAPI, CORS, подключение роутеров
- **config.py** — настройки из переменных окружения
- **database.py** — подключение к PostgreSQL, фабрика сессий
- **dependencies.py** — зависимости для авторизации (JWT)
- **schemas.py** — Pydantic-модели для валидации
- **utils.py** — утилиты (JWT, bcrypt)
- **models/** — ORM-модели (таблицы БД)
- **routes/** — роутеры по доменам (auth, songs, albums и т.д.)

---

## Как это работает

1. **main.py** создаёт приложение FastAPI, добавляет CORS и подключает все роутеры с префиксами (`/api/auth`, `/api/songs` и т.д.).

2. **config.py** читает `DATABASE_URL`, `SECRET_KEY`, `ADMIN_EMAILS` из `.env` или окружения.

3. **database.py** создаёт движок SQLAlchemy и фабрику сессий; `get_db` — зависимость FastAPI, которая на каждый запрос создаёт сессию и закрывает её после ответа.

4. **dependencies.py** предоставляет `get_current_user_id` (извлекает UUID из JWT) и `get_admin_user_id` (проверяет, что пользователь — админ).

5. **schemas.py** описывает форматы входа/выхода API (UserCreate, Token, AlbumResponse и т.д.).

6. **utils.py** содержит функции для создания и проверки JWT, хеширования паролей (bcrypt).

7. **models/** — классы SQLAlchemy (AuthUser, Album, Track, Playlist и т.д.), маппятся на таблицы PostgreSQL.

8. **routes/** — каждый файл — APIRouter с эндпоинтами своего домена; main.py подключает их через `app.include_router()`.
