# Backend Routes

**Изображение:** `backend-routes.png`

---

## Что изображено

Структура API: все роутеры FastAPI и их префиксы. Каждый роутер отвечает за свой домен (auth, songs, albums и т.д.).

---

## Как это работает

В `main.py` каждый роутер подключается через `app.include_router(router, prefix="...", tags=["..."])`. Tags группируют эндпоинты в Swagger UI.

| Префикс | Роутер | Основные эндпоинты | Назначение |
|---------|--------|--------------------|------------|
| `/api/auth` | auth | POST /register, /login, /refresh, GET /me | Регистрация, вход, обновление токена |
| `/api/songs` | songs | GET /, GET /{id}, POST /, PUT /{id}, DELETE /{id} | CRUD треков |
| `/api/albums` | albums | GET /, GET /{id}, POST /, PUT /{id}, DELETE /{id} | CRUD альбомов |
| `/api/playlists` | playlists | GET /, GET /{id}, POST /, PUT /{id}, DELETE /{id}, POST /{id}/tracks | Плейлисты и треки в них |
| `/api/search` | search | GET / (query params) | Поиск по трекам, альбомам, исполнителям |
| `/api/users` | users | GET /me, PUT /me | Профиль пользователя |
| `/api/player` | player | POST /play, GET /history | Запись прослушиваний, история |
| `/api/recommendations` | recommendations | GET / | Рекомендации на основе истории |
| `/api/upload` | upload | POST /image, /audio | Загрузка изображений и аудио |
| `/api/seed` | seed | POST /seed | Наполнение БД тестовыми данными |
| `/ws` | websocket | WebSocket | Чат в реальном времени |

Роутеры изолированы: каждый в своём файле, со своими зависимостями. Это упрощает поддержку и позволяет в будущем вынести домены в отдельные микросервисы.
