# app/core/config.py
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── 基础 ──────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-please-use-a-long-random-string-in-production"

    DATABASE_URL: str = "sqlite+aiosqlite:///./dev.db"

    # ── JWT ───────────────────────────────────────────────────
    JWT_EXPIRE_DAYS: int = 7

    STABILITY_API_KEY: str = ""

    CORS_ORIGINS: str = "*"

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_serverless(self) -> bool:
        import os
        return os.environ.get("VERCEL") == "1"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
