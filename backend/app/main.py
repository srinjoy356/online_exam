"""
app/main.py
-----------
FastAPI application factory.
Registers routers, CORS middleware, and a startup hook
that creates tables if they don't exist yet.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
# Import models so SQLAlchemy registers them before create_all
from app.models import models  # noqa: F401
from app.api.routes import auth, admin, student

# ── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.APP_ENV == "development" else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("exam_system")


# ── Lifespan: run DB init on startup ─────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up – initialising database tables…")
    Base.metadata.create_all(bind=engine)
    logger.info("Database ready.")
    yield
    logger.info("Shutting down.")


# ── Application factory ───────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="Online Examination System API",
        version="1.0.0",
        description="RESTful backend for exam creation, student management, and result evaluation.",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────
    app.include_router(auth.router,    prefix="/api/v1")
    app.include_router(admin.router,   prefix="/api/v1")
    app.include_router(student.router, prefix="/api/v1")

    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "ok", "environment": settings.APP_ENV}

    return app


app = create_app()


# ── Dev entrypoint ────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.APP_PORT,
        reload=(settings.APP_ENV == "development"),
    )
