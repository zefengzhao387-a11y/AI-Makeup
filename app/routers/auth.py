# app/routers/auth.py
"""
模块三 · 认证接口
=================
POST /api/auth/register   账号密码注册
POST /api/auth/login      账号密码登录
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.auth import LoginSchema, RegisterSchema, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    summary="账号密码注册",
)
async def register(body: RegisterSchema, db: AsyncSession = Depends(get_db)):
    user = await AuthService.register(db, body.username, body.password, body.nickname)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user_id=user.id, is_new_user=True)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="账号密码登录",
)
async def login(body: LoginSchema, db: AsyncSession = Depends(get_db)):
    user = await AuthService.login(db, body.username, body.password)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user_id=user.id)
