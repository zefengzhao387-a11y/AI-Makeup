# app/core/config.py
from pydantic_settings import BaseSettings
from typing import List, Tuple, Dict, Any
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse


class Settings(BaseSettings):
    # ── 基础 ──────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-please-use-a-long-random-string-in-production"

    DATABASE_URL: str = "sqlite+aiosqlite:///./dev.db"
    POSTGRES_URL: str = ""
    PRISMA_DATABASE_URL: str = ""

    # ── JWT ───────────────────────────────────────────────────
    JWT_EXPIRE_DAYS: int = 7

    # 硅基流动 SiliconFlow（AI 试妆 / 图像编辑）
    SILICONFLOW_API_KEY: str = ""

    # 备用（已弃用）
    TOGETHER_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    STABILITY_API_KEY: str = ""

    # DeepSeek LLM (AI 美妆顾问)
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"

    CORS_ORIGINS: str = "*"

    @property
    def resolved_database_url(self) -> str:
        """Vercel + Prisma 通常只注入 POSTGRES_URL，需兼容读取"""
        if self.DATABASE_URL.startswith(("postgres://", "postgresql")):
            return self.DATABASE_URL
        if self.POSTGRES_URL:
            return self.POSTGRES_URL
        if self.PRISMA_DATABASE_URL:
            return self.PRISMA_DATABASE_URL
        return self.DATABASE_URL

    @property
    def database_url(self) -> str:
        url, _ = self.database_url_and_connect_args
        return url

    @property
    def database_url_and_connect_args(self) -> Tuple[str, Dict[str, Any]]:
        """把 Vercel / Prisma 的 postgres:// 转为 SQLAlchemy asyncpg 可用格式"""
        url = self.resolved_database_url
        connect_args: Dict[str, Any] = {}

        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        if "+asyncpg" in url:
            parsed = urlparse(url)
            qs = parse_qs(parsed.query)
            sslmode = qs.pop("sslmode", [None])[0]
            if sslmode in ("require", "verify-full", "verify-ca", "prefer"):
                connect_args["ssl"] = True
            if qs:
                url = urlunparse(parsed._replace(query=urlencode({k: v[0] for k, v in qs.items()})))
            else:
                url = urlunparse(parsed._replace(query=""))

        return url, connect_args

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
