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

if is_sqlite:
    connect_args = {"check_same_thread": False}
else:
    # psycopg3 (psycopg[binary]) adds ::TYPE casts to ALL parameterized query
    # parameters when using prepared statements (the default). PostgreSQL rejects
    # these casts for ENUM, DATE, and other non-VARCHAR columns, causing 500 errors.
    #
    # Setting prepare_threshold=0 disables prepared statement caching entirely,
    # which prevents psycopg3 from injecting any ::TYPE annotations.
    # This is the correct fix for SQLAlchemy 2.x + psycopg3 on Supabase/RDS.
    connect_args = {"prepare_threshold": 0}

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
