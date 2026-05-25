"""
一次性在远程 Postgres（含 Vercel Prisma Postgres）建表并写入种子数据。

用法：
  1. 在 Vercel → Storage → 你的 Prisma Postgres → .env.local 复制 DATABASE_URL / POSTGRES_URL
  2. 写入本地 .env：DATABASE_URL=postgres://...
  3. 运行：
     pip install -r requirements.txt
     python scripts/init_db.py
"""
import asyncio
import sys
from pathlib import Path

# 保证能 import app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


async def main() -> None:
    from app.core.config import settings
    from app.core.database import init_db

    url = settings.database_url
    safe = url.split("@")[-1] if "@" in url else url
    print(f"目标数据库: ...@{safe}")

    if url.startswith("sqlite"):
        print("当前是 SQLite。若要初始化 Prisma Postgres，请先在 .env 里设置 DATABASE_URL=postgres://...")
        sys.exit(1)

    await init_db()
    print("建表完成，种子数据已写入（users / products / conversation_sessions / conversations）")


if __name__ == "__main__":
    asyncio.run(main())
