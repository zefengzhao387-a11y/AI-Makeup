# app/models/user.py
"""
User ORM 模型 —— 字段与原版保持一致，保证前端零改动
"""
from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # ── 账号 ──────────────────────────────────────────────────
    username        = Column(String(50),  unique=True, nullable=True, index=True)
    hashed_password = Column(String(255),               nullable=True)

    # ── 展示资料 ──────────────────────────────────────────────
    nickname   = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # ── 个性化属性（给模块二 RAG 推荐用）─────────────────────
    skin_type        = Column(String(20), nullable=True)
    skin_tone        = Column(String(20), nullable=True)
    face_shape       = Column(String(20), nullable=True)
    skin_sensitivity = Column(String(20), nullable=True)
    allergens        = Column(JSON,       nullable=True)
    skin_analysis_result = Column(JSON, nullable=True)
    preferences = Column(JSON, nullable=True)

    # ── 状态 ──────────────────────────────────────────────────
    is_active = Column(Boolean, default=True, nullable=False)

    # ── 时间戳 ────────────────────────────────────────────────
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)
