# app/schemas/auth.py
"""认证相关请求 / 响应数据契约"""
from pydantic import BaseModel, Field
from typing import Optional


class RegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, examples=["beauty_user"])
    password: str = Field(..., min_length=8, max_length=100, examples=["MyPass123!"])
    nickname: Optional[str] = Field(None, max_length=100)


class LoginSchema(BaseModel):
    username: str = Field(..., examples=["beauty_user"])
    password: str = Field(..., examples=["MyPass123!"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 604800   # 7 天，单位秒
    user_id: int
    is_new_user: bool = False
