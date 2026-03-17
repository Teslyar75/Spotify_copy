# Architecture Diagrams — Spotify Clone

**Project:** Spotify Clone (fullstack web application)  
**Stack:** FastAPI + React + PostgreSQL + Docker + Nginx

> Каждая диаграмма находится в своей папке вместе с README.md, где дано подробное описание: что изображено и как это работает.

---

## Diagram 1: Architecture Overview

**Папка:** `architecture-overview/`  
**Файл:** `architecture-overview.png`

High-level architecture showing all components running in Docker containers:

- **Browser/Client** — user accesses the application
- **Nginx** — reverse proxy (ports 80/443), serves static files and proxies API/media
- **Frontend** — React SPA (Vite build), static files from Nginx
- **Backend** — FastAPI + Uvicorn, REST API, Swagger documentation
- **PostgreSQL 16** — relational database
- **Media volume** — stored audio files

All services run inside Docker containers. Nginx routes:
- `/` → React SPA
- `/api/*` → FastAPI backend
- `/media/*` → FastAPI (uploaded files)
- `/ws/*` → FastAPI WebSocket

---

## Diagram 2: Request Flow

**Папка:** `architecture-request-flow/`  
**Файл:** `architecture-request-flow.png`

Request routing flow:

1. **User** → Nginx (port 3000/80)
2. **Nginx** routes:
   - `/` and static assets (JS, CSS) → React SPA (`index.html`)
   - `/api/*` → FastAPI backend (port 8000)
   - `/media/*` → FastAPI backend (audio files)
   - `/ws/*` → FastAPI backend (WebSocket)
3. **Backend** → PostgreSQL (database queries)
4. **Backend** → Media volume (file storage)

---

## Docker Compose Services

| Service   | Image/Build      | Port  | Purpose                    |
|----------|------------------|-------|----------------------------|
| postgres | postgres:16-alpine | 5432 | Database                   |
| backend  | Dockerfile.backend | 8000 | FastAPI API                |
| frontend | Dockerfile.frontend | 3000→80 | Nginx + React SPA    |

---

# Backend — Detailed Diagrams

## Diagram 3: Backend Structure

**Папка:** `backend-structure/`  
**Файл:** `backend-structure.png`

Structure of the `app/` package:

- **main.py** — FastAPI instance, CORS, router registration, `/health` endpoint
- **config.py** — settings from environment (DATABASE_URL, SECRET_KEY, ADMIN_EMAILS)
- **database.py** — SQLAlchemy engine, SessionLocal, `get_db` dependency
- **dependencies.py** — `get_current_user_id`, `get_admin_user_id`, `get_optional_user_id`
- **schemas.py** — Pydantic models for request/response validation
- **utils.py** — JWT (create/decode tokens), bcrypt (hash/verify passwords)
- **models/** — ORM: AuthUser, UserProfile, Album, Track, Playlist, PlaylistTrack, ListeningHistory, UserStatus, Message
- **routes/** — routers: auth, songs, albums, playlists, search, users, player, recommendations, upload, seed, websocket

---

## Diagram 4: Request Processing Flow

**Папка:** `backend-request-flow/`  
**Файл:** `backend-request-flow.png`

Flow of a single HTTP request through the backend:

1. **HTTP Request** — with optional `Authorization: Bearer <token>` header
2. **CORS middleware** — adds `Access-Control-Allow-Origin` headers
3. **Router match** — e.g. `/api/songs` → songs router
4. **Dependencies** — `get_db` (creates Session, yields, closes after response); `get_current_user_id` (extracts JWT, decodes, returns UUID or 401)
5. **Handler** — business logic (query DB, return JSON)
6. **Response** — JSON sent to client

---

## Diagram 5: Database Layer

**Папка:** `backend-database-layer/`  
**Файл:** `backend-database-layer.png`

SQLAlchemy + PostgreSQL:

- **Engine** — connection pool, `pool_pre_ping=True` (reconnect if connection died)
- **SessionLocal** — session factory (`autocommit=False`, `autoflush=False`)
- **get_db** — FastAPI dependency: `yield` session, `finally db.close()`
- **Models** — AuthUser, UserProfile, Album, Track, Playlist, PlaylistTrack, ListeningHistory, UserStatus, Message
- Each request gets a fresh Session; after response, connection returns to pool

---

## Diagram 6: JWT Authentication Flow

**Папка:** `backend-auth-flow/`  
**Файл:** `backend-auth-flow.png`

**Login flow:**
1. `POST /api/auth/login` — email + password
2. `verify_password` — bcrypt comparison
3. `create_access_token` + `create_refresh_token` — JWT signed with SECRET_KEY
4. Return `{ access_token, refresh_token }`

**Protected endpoint flow:**
1. Request with `Authorization: Bearer <token>`
2. `HTTPBearer` — extracts token from header
3. `decode_token` — verifies signature and `exp` (expiration)
4. `get_current_user_id` — returns UUID from `sub` claim, or 401 if invalid

---

## Diagram 7: API Routes Structure

**Папка:** `backend-routes/`  
**Файл:** `backend-routes.png`

All routers mounted in `main.py`:

| Prefix | Router | Purpose |
|--------|--------|---------|
| `/api/auth` | auth | register, login, refresh, /me |
| `/api/songs` | songs | CRUD tracks |
| `/api/albums` | albums | CRUD albums |
| `/api/playlists` | playlists | CRUD playlists |
| `/api/search` | search | search tracks, albums, artists |
| `/api/users` | users | profiles |
| `/api/player` | player | play history |
| `/api/recommendations` | recommendations | personalized recommendations |
| `/api/upload` | upload | image/audio upload |
| `/api/seed` | seed | test data |
| `/ws` | websocket | real-time chat |

---

*For defense presentation — March 2026*
