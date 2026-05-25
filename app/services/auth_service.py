# app/services/auth_service.py
"""注册 / 登录业务逻辑（轻量版，去除了微信登录）"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.core.security import hash_password, verify_password
from app.core.exceptions import (
    AuthError,
    ResourceConflictError,
    BusinessError,
)


class AuthService:

    @staticmethod
    async def register(
        db: AsyncSession,
        username: str,
        password: str,
        nickname: str = None,
    ) -> User:
        # 用户名唯一性
        r = await db.execute(select(User).where(User.username == username))
        if r.scalar_one_or_none():
            raise ResourceConflictError(
                message="用户名已被注册",
                user_action="请换一个用户名，或直接登录",
            )

        user = User(
            username=username,
            hashed_password=hash_password(password),
            nickname=nickname or username,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def login(db: AsyncSession, username: str, password: str) -> User:
        r = await db.execute(select(User).where(User.username == username))
        user = r.scalar_one_or_none()

        if not user or not user.hashed_password:
            raise AuthError(
                message="用户名或密码错误",
                user_action="请检查输入",
            )
        if not verify_password(password, user.hashed_password):
            raise AuthError(
                message="用户名或密码错误",
                user_action="请检查输入",
            )
        if not user.is_active:
            raise BusinessError(
                message="账号已被禁用",
                user_action="请联系管理员",
            )
        return user
