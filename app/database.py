"""Подключение к БД и сессии SQLAlchemy."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,  # True для отладки SQL-запросов
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency для FastAPI — получение сессии БД."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Создание всех таблиц (для инициализации без миграций)."""
    import app.models  # noqa: F401 — загрузка моделей для регистрации в metadata

    Base.metadata.create_all(bind=engine)
