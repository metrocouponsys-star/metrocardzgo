"""
Metro Cardz — Database Connection & Session Management
Database: Hostinger MySQL via PyMySQL + SQLAlchemy 2.x
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
is_sqlite = settings.database_url.startswith("sqlite")

if is_sqlite:
    connect_args = {"check_same_thread": False}
else:
    # MySQL connection settings:
    # - charset=utf8mb4: full Unicode support (emojis, Indian scripts)
    # - autocommit=False: managed by SQLAlchemy sessions
    connect_args = {
        "charset": "utf8mb4",
        "connect_timeout": 10,
    }

engine_kwargs = {
    "pool_pre_ping": True,    # Re-validate connections on checkout (prevents stale connections)
    "pool_recycle": 280,      # Recycle before MySQL's default 300s wait_timeout
}
if not is_sqlite:
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
    })

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass
