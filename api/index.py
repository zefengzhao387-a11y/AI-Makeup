# api/index.py
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from mangum import Mangum

from app.core.config import settings
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
)


# ── 日志配置（只输出 stdout，不写文件 —— Vercel 文件系统只读）─
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ── 生命周期：本地启动时建表 + 种子数据 ─────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"应用启动 env={settings.APP_ENV} serverless={settings.is_serverless}")

    if not settings.is_serverless:
        try:
            from app.core.database import init_db
            await init_db()
        except Exception as e:
            logger.warning(f"数据库初始化失败（开发可忽略）: {e}")
    else:
        logger.info("Serverless 环境，跳过自动建表，请确保数据库已就绪")

    yield
    logger.info("应用关闭")


# ── FastAPI 实例 ────────────────────────────────────────────
app = FastAPI(
    title="Lumina Beauty AI API",
    description=(
        "美妆 AI 商城后端（轻量演示版）\n\n"
        "**模块对应**\n"
        "- 模块一 · 化妆 AI：`GET /api/makeup/styles`、`POST /api/makeup/try-on`\n"
        "- 模块一 · 图像编辑：`POST /api/image-edit`\n"
        "- 模块二 · RAG Agent：消费 `/api/products` + `/api/conversations`\n"
        "- 模块三 · 业务后端：本服务（认证 / 商品 / 对话存取）\n"
    ),
    version="2.0.0-lite",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ── CORS（唯一保留的中间件）─────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 异常处理器 ──────────────────────────────────────────────
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


# ── 路由注册 ────────────────────────────────────────────────
from app.routers import auth, products, conversations, image_edit, makeup, agent

app.include_router(auth.router,          prefix="/api/auth",          tags=["认证"])
app.include_router(products.router,      prefix="/api/products",      tags=["商品"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["对话"])
app.include_router(agent.router,         prefix="/api/agent",         tags=["AI 顾问"])
app.include_router(makeup.router,        prefix="/api/makeup",        tags=["化妆 AI"])
app.include_router(image_edit.router,    prefix="/api",               tags=["图像编辑"])


# ── 简单的根 / 健康检查 ─────────────────────────────────────
@app.get("/", tags=["root"])
async def root():
    return {
        "name": "Lumina Beauty AI",
        "version": "2.0.0-lite",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["root"])
async def health():
    db_ok = False
    db_error = None
    try:
        from sqlalchemy import text
        from app.core.database import engine
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_error = str(e)[:200]
        logger.warning(f"health db check failed: {e}")
    return {
        "status": "ok" if db_ok or settings.database_url.startswith("sqlite") else "degraded",
        "env": settings.APP_ENV,
        "database": "ok" if db_ok else "error",
        "database_error": db_error,
        "database_source": "postgres" if "postgres" in settings.resolved_database_url else "sqlite",
    }


# ── Vercel 部署需要：把 ASGI 应用包成 Lambda handler ────────
handler = Mangum(app)
