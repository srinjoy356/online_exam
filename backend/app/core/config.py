"""
app/core/config.py
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path

_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres.teskxiipidkvxwpgmtxy:April%401904010@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

    # ── JWT ───────────────────────────────────────────────
    JWT_SECRET_KEY: str = "changeme"
    JWT_ALGORITHM:  str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── App ───────────────────────────────────────────────
    APP_ENV:      str = "development"
    APP_PORT:     int = 8000
    CORS_ORIGINS: str = "https://exam-system-frontend-4gr2.onrender.com"

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()