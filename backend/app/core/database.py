"""
Metro Cardz — Database Connection & Session Management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
# pool_pre_ping=True: re-validates connections on checkout (prevents stale connections
# after Supabase/Render free-tier instance restarts)
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,           # Keep 5 connections ready
    max_overflow=10,       # Allow 10 overflow connections under load
    pool_recycle=300,      # Recycle connections after 5 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass
