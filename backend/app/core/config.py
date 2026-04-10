"""
app/core/config.py
------------------
Centralised application settings loaded from environment variables
via pydantic-settings. All sensitive values must live in .env.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

import os
from pathlib import Path

# This finds the .env file relative to this config.py file's location
# config.py is at app/core/config.py, so .env is 2 levels up (backend/.env)
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"

print(_ENV_FILE)


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "exam_system"
    DB_USER: str = "exam_user"
    DB_PASSWORD: str = "exam123"

    # ── JWT ───────────────────────────────────────────────
    JWT_SECRET_KEY: str = "5b412bb874307e2eea3425f4d7c533db3b720a155c76667edcdbf40d4527efb1"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── App ───────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    

    @property
    def DATABASE_URL(self) -> str:
        print("DB USER:", self.DB_USER)
        print("DB PASS:", self.DB_PASSWORD)
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            "?charset=utf8mb4"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


@lru_cache()          # singleton – loaded once per process
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

if __name__ == "__main__":
    print("--- SCRIPT STARTING ---")
    settings = get_settings()
    print("DB USER:", settings.DB_USER)
    print("DB PASS:", settings.DB_PASSWORD)
    print("FULL URL:", settings.DATABASE_URL)

    print("Looking for .env at:", _ENV_FILE)
    print("File exists?", _ENV_FILE.exists())

