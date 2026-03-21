# Инструкция по деплою (Spotify Clone)

Полный стек в одном **Docker Compose**: PostgreSQL 16, FastAPI (uvicorn), статика фронта (Vite build) за **nginx** с проксированием `/api`, `/ws`, `/media` на backend.

| Файл | Назначение |
|------|------------|
| `docker-compose.yml` | Разработка: монтирование `./app`, порты 5432/8000/3000 |
| `docker-compose.prod.yml` | Продакшен: код только из образа, БД без публикации порта |
| `.env.prod.example` | Шаблон переменных → скопируйте в `.env.prod` |

Файл **`.env.prod` в репозиторий не коммитится** (см. `.gitignore`).

---

## 1. Требования на сервере

- **Docker Engine** 20.10+ и плагин **Docker Compose** v2 ([установка](https://docs.docker.com/engine/install/)).
- Открытый **порт 80** (или другой — см. `FRONTEND_HTTP_PORT`), если доступ с интернета.
- ~2 ГБ RAM минимум для комфортной работы Postgres + backend + nginx.

---

## 2. Подготовка на сервере

```bash
git clone https://github.com/Teslyar75/Spotify_copy.git
cd Spotify_copy
cp .env.prod.example .env.prod
```

Отредактируйте **`.env.prod`**.

### Обязательно заполните

| Переменная | Описание |
|------------|----------|
| `POSTGRES_PASSWORD` | Сильный пароль БД (латиница, без пробелов в начале/конце). |
| `SECRET_KEY` | Секрет для подписи JWT. Пример генерации (Linux/macOS): `openssl rand -base64 48` |
| `CORS_ORIGINS` | Точный публичный URL сайта (схема + хост + порт). Несколько origin’ов — **через запятую**. Пример: `https://music.example.com` |

### Желательно

| Переменная | Описание |
|------------|----------|
| `ADMIN_EMAILS` | Email администраторов через запятую (доступ к админ-функциям в API). |
| `JAMENDO_CLIENT_ID` | Свой ключ [Jamendo Dev Portal](https://devportal.jamendo.com), если нужен импорт. |
| `FRONTEND_HTTP_PORT` | Порт на хосте для контейнера фронта (по умолчанию `80`). |

`POSTGRES_USER` и `POSTGRES_DB` можно оставить по умолчанию (`postgres` / `spotify_clone`), если нет особых требований.

---

## 3. Запуск продакшена

Из корня репозитория:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

При старте backend выполняет **`alembic upgrade head`**, затем **uvicorn**.

### Проверка

- Сайт: `http://<IP_или_домен>/` (порт по `FRONTEND_HTTP_PORT`).
- API health (через прокси nginx на том же хосте):  
  `curl -s http://127.0.0.1/api/health`  
  (снаружи замените на ваш домен; ожидается JSON с полем `database`).

### Логи

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f frontend
```

### Остановка

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

Данные **PostgreSQL** и загруженные **медиафайлы** сохраняются в volume’ах `postgres_data_prod` и `media_data_prod` и не удаляются командой `down` без флага `-v`.

---

## 4. Windows (PowerShell) — те же шаги

```powershell
cd D:\Spotify_copy
Copy-Item .env.prod.example .env.prod
# отредактируйте .env.prod вручную

$env:SECRET_KEY = "..."   # только если не хотите хранить в файле — обычно правьте .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Compose читает переменные из `--env-file .env.prod` для подстановки в `docker-compose.prod.yml`.

---

## 5. HTTPS и домен

1. Настройте **A-запись** DNS на IP сервера.
2. Перед контейнерами поставьте **Caddy** или **nginx** на хосте с **Let’s Encrypt** и проксируйте на `127.0.0.1:80` (или на `127.0.0.1:<FRONTEND_HTTP_PORT>`).
3. В **`CORS_ORIGINS`** укажите **`https://ваш-домен`** (без слэша в конце, как правило).

---

## 6. Как устроен трафик

- Браузер открывает только **фронт** (nginx).
- Запросы к API идут на **относительный путь `/api`** (см. `frontend/src/lib/axios.ts`).
- `frontend/nginx.conf` проксирует `/api`, `/ws`, `/media` на сервис **`backend:8000`** внутри Docker-сети.
- Порт **8000** наружу публиковать не обязательно.

---

## 7. Обновление после `git pull`

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

---

## 8. Наполнение каталога (опционально)

Если в проекте есть эндпоинты seed (например `/api/seed`), вызовите их **после** первого успешного старта и миграций, с учётом прав администратора. Подробности — в документации проекта / `project_defense`.

---

## 9. Частые проблемы

| Симптом | Что проверить |
|---------|----------------|
| Браузер: CORS error | `CORS_ORIGINS` должен **точно** совпадать с origin страницы (схема + хост + порт). |
| 401 у всех после рестарта | Сменился `SECRET_KEY` — старые JWT недействительны, войдите заново. |
| Compose не стартует | Сообщение `set ... in .env.prod` — не заданы обязательные переменные в `.env.prod`. |
| Пустая БД | Выполнены ли миграции (смотрите логи backend при старте). |

---

## 10. Локальная разработка (напоминание)

```bash
docker compose up -d
```

Используется **`docker-compose.yml`** (hot-reload кода через volume’ы).

---

## 11. Облако (кратко)

Текущий репозиторий рассчитан на **один VPS + Compose**. Разнесение (отдельный Postgres, отдельный хостинг фронта) возможно, но потребует своих URL, `CORS_ORIGINS` и при необходимости пересборки фронта с нужными `VITE_*` или единого reverse proxy.

### Примечание для Railway / отдельного фронта

В `frontend/nginx.conf` по умолчанию **`proxy_pass http://backend:8000`** — это имя сервиса **backend** внутри `docker-compose.yml` / `docker-compose.prod.yml`. Если фронт крутится **вне** той же Docker-сети, замените хост на публичный или внутренний URL вашего API и пересоберите образ фронта (или используйте свой nginx/Caddy с нужным `proxy_pass`).
