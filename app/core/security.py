# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings

ALGORITHM = "HS256"


# ── 密码哈希 ─────────────────────────────────────────────────
def hash_password(password: str) -> str:
    """对明文密码进行 bcrypt 哈希（12 轮加盐）"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """验证明文密码与哈希是否匹配"""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ── JWT ─────────────────────────────────────────────────────
def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """签发 JWT，默认 7 天有效"""
    if expires_delta is None:
        expires_delta = timedelta(days=settings.JWT_EXPIRE_DAYS)
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "exp": now + expires_delta,
        "iat": now,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """解码 JWT 并校验，失败返回 401"""
    err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token 无效或已过期",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise err
        return {"user_id": int(user_id)}
    except JWTError:
        raise err
