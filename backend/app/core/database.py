"""
Metro Cardz — Database Connection & Session Management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
# pool_pre_ping=True: re-validates connections on checkout (prevents stale connections
# after Supabase/Render free-tier instance restarts)
is_sqlite = settings.database_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}
engine_kwargs = {"pool_pre_ping": True}
if not is_sqlite:
    engine_kwargs.update({"pool_size": 5, "max_overflow": 10, "pool_recycle": 300})

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass
