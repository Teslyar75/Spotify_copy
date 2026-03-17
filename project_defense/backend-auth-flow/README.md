# Backend Auth Flow

**Изображение:** `backend-auth-flow.png`

---

## Что изображено

Два потока: **вход в систему** (login) и **доступ к защищённому эндпоинту** (protected endpoint).

**Login:** email + password → проверка → токены  
**Protected:** Bearer token → проверка → UUID пользователя или 401

---

## Как это работает

### Поток входа (Login)

1. Клиент отправляет `POST /api/auth/login` с телом `{ "email": "...", "password": "..." }`.

2. Backend ищет пользователя по email в таблице `auth_users`.

3. **verify_password** — сравнивает переданный пароль с `password_hash` через bcrypt. Bcrypt сам извлекает соль из хеша и проверяет совпадение. Если не совпадает — 401.

4. **create_access_token** и **create_refresh_token** — генерируют JWT:
   - В payload: `sub` (user_id), `exp` (срок действия)
   - Подпись: HMAC-SHA256 с `SECRET_KEY`
   - Access token живёт ~30 минут, refresh — несколько дней

5. Ответ: `{ "access_token": "...", "refresh_token": "...", "token_type": "bearer" }`.

6. Frontend сохраняет токены (localStorage) и добавляет `Authorization: Bearer <access_token>` к каждому запросу.

### Поток защищённого эндпоинта (Protected)

1. Запрос приходит с заголовком `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`.

2. **HTTPBearer** (FastAPI security) извлекает строку токена из заголовка. Если заголовка нет — сразу 403 (для `get_current_user_id`) или None (для `get_optional_user_id`).

3. **decode_token** — проверяет подпись (SECRET_KEY) и срок действия (`exp`). Если токен подделан или истёк — возвращает None.

4. **get_current_user_id** — извлекает `sub` (UUID пользователя) из payload. Если payload невалиден — выбрасывает 401, handler не вызывается.

5. Handler получает `user_id: UUID` и может использовать его для фильтрации данных (например, только плейлисты текущего пользователя).
