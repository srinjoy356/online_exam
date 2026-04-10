"""
app/db/session.py
-----------------
SQLAlchemy engine + session factory.
Use `get_db()` as a FastAPI dependency to obtain a scoped session.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────
# pool_pre_ping=True re-validates stale connections (important for MySQL)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=(settings.APP_ENV == "development"),  # log SQL in dev
)

# ── Session factory ───────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# ── Base class for all ORM models ─────────────────────────
class Base(DeclarativeBase):
    pass


# ── FastAPI dependency ─────────────────────────────────────
def get_db():
    """
    Yield a database session and ensure it is closed after the request,
    even if an exception occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
