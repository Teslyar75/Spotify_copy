# Backend Database Layer

**Изображение:** `backend-database-layer.png`

---

## Что изображено

Слой работы с базой данных: SQLAlchemy и PostgreSQL.

- **PostgreSQL** — реляционная СУБД
- **Engine** — пул соединений SQLAlchemy
- **SessionLocal** — фабрика сессий
- **get_db** — FastAPI dependency
- **Models** — ORM-модели (AuthUser, UserProfile, Album, Track, Playlist и т.д.)

---

## Как это работает

1. **Engine** (`create_engine`) создаёт пул соединений к PostgreSQL. `pool_pre_ping=True` — перед выдачей соединения выполняется `SELECT 1`; если соединение «умерло», оно переподключается. Это предотвращает ошибки после долгого простоя.

2. **SessionLocal** — фабрика сессий (`sessionmaker`). Каждый HTTP-запрос получает свою сессию. `autocommit=False` — изменения не отправляются автоматически, нужен явный `db.commit()`. `autoflush=False` — контроль момента отправки SQL.

3. **get_db** — FastAPI dependency:
   - Создаёт `db = SessionLocal()`
   - Передаёт в handler через `yield db`
   - В `finally` вызывает `db.close()` — соединение возвращается в пул

4. **Models** — классы, наследующие `Base` (declarative_base). Каждый класс — таблица в PostgreSQL:
   - `AuthUser` — учётные данные (email, password_hash)
   - `UserProfile` — публичный профиль (username, avatar)
   - `Album` — альбомы
   - `Track` — треки (связь с альбомом)
   - `Playlist`, `PlaylistTrack` — плейлисты и их треки
   - `ListeningHistory` — история прослушиваний
   - `UserStatus`, `Message` — для WebSocket-чата

5. В handler: `db.query(Track).filter(Track.album_id == id).all()` — SQLAlchemy генерирует SQL, выполняет его, возвращает объекты Python.
