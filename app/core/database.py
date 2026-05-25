# app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


# SQLite 不能用连接池参数；Serverless 用 NullPool 避免连接泄漏
_engine_kwargs = {"echo": False}
if settings.database_url.startswith("sqlite"):
    pass
elif settings.is_serverless:
    _engine_kwargs["poolclass"] = NullPool
else:
    _engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
    })

engine = create_async_engine(
    settings.database_url,
    connect_args=settings.database_url_and_connect_args[1],
    **_engine_kwargs,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类"""
    pass


async def get_db():
    """
    FastAPI 依赖：用法
        async def endpoint(db: AsyncSession = Depends(get_db)):
            ...
    自动提交 / 回滚事务。
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """
    自动建表 + 注入种子数据。
    本地开发用；生产环境建议用迁移工具。
    """
    # 导入所有模型让 Base.metadata 知道有哪些表
    from app.models import user, product, conversation  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("数据库表初始化完成")

    # 注入种子数据（admin + 商品）
    from app.core.seed import seed_all
    await seed_all()
