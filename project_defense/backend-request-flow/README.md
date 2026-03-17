# Backend Request Flow

**Изображение:** `backend-request-flow.png`

---

## Что изображено

Последовательность обработки одного HTTP-запроса внутри бэкенда FastAPI.

- **HTTP Request** — входящий запрос (с опциональным заголовком `Authorization`)
- **CORS** — middleware, добавляющий заголовки для кросс-доменных запросов
- **Router** — выбор обработчика по пути
- **Dependencies** — `get_db`, `get_current_user_id`
- **Handler** — функция-обработчик с бизнес-логикой
- **Response** — JSON-ответ клиенту

---

## Как это работает

1. **HTTP Request** приходит на backend (например, `GET /api/songs` с заголовком `Authorization: Bearer <token>`).

2. **CORS middleware** добавляет заголовки `Access-Control-Allow-Origin` и др., чтобы браузер разрешил запрос с другого домена (frontend на :3000 → backend на :8000).

3. **Router** сопоставляет путь с роутером: `/api/songs` → `songs.router`, эндпоинт `GET /` или `GET /{id}`.

4. **Dependencies** выполняются до вызова обработчика:
   - **get_db** — создаёт сессию SQLAlchemy, передаёт её в handler, после ответа закрывает (`yield` + `finally db.close()`)
   - **get_current_user_id** — извлекает JWT из `Authorization`, декодирует, проверяет подпись и срок действия; возвращает UUID пользователя или выбрасывает 401

5. **Handler** получает `db` и `user_id`, выполняет запрос к БД (например, `db.query(Track).all()`), формирует ответ.

6. **Response** — FastAPI сериализует результат в JSON и отправляет клиенту.

Если dependency выбросит исключение (например, 401 от `get_current_user_id`), handler не вызывается — клиент сразу получает ошибку.
