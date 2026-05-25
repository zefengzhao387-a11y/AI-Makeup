# app/models/product.py
"""
商品表 —— 与模块二(Agent 开发者)的接口契约对齐:
- skin_tones      ← 适合肤色(模块二要求的字段名)
- face_shapes     ← 适合脸型(模块二要求的字段名)
- route_path      ← 前端跳转路由(推荐结果必须携带)
"""
from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # ── 基本信息 ──────────────────────────────────────────────
    name        = Column(String(200), nullable=False, index=True)
    brand       = Column(String(100), nullable=True, index=True)
    category    = Column(String(50),  nullable=True, index=True,
                         comment="一级分类:Lips / Face / Eyes / Skincare")
    subcategory = Column(String(50),  nullable=True,
                         comment="二级分类:lipstick / foundation / serum ...")

    # ── 价格与销量 ────────────────────────────────────────────
    price          = Column(Float,   nullable=True)
    original_price = Column(Float,   nullable=True, comment="原价")
    sales_count    = Column(Integer, nullable=True, default=0)
    rating         = Column(Float,   nullable=True)
    review_count   = Column(Integer, nullable=True, default=0)

    # ── 详细描述 ──────────────────────────────────────────────
    description = Column(Text, nullable=True)
    ingredients = Column(Text, nullable=True)
    usage_tips  = Column(Text, nullable=True)

    # ── 媒体 ──────────────────────────────────────────────────
    image_url = Column(String(500), nullable=True)
    images    = Column(JSON,        nullable=True, comment="['url1','url2']")

    # ── 适用标签(模块二 Agent 用于 RAG)──────────────────────
    # 字段名严格对齐《接口说明文档》
    skin_types  = Column(JSON, nullable=True,
                         comment="适用肤质 ['dry','oily','combination','sensitive','normal']")
    skin_tones  = Column(JSON, nullable=True,
                         comment="适合肤色 ['cool','warm','deep','light']")
    face_shapes = Column(JSON, nullable=True,
                         comment="适合脸型 ['oval','round','square','heart','long']")
    sensitive_safe = Column(Boolean, default=False, nullable=False,
                            comment="是否敏感肌友好")

    tags = Column(JSON, nullable=True, comment="['热销','新品','明星单品']")

    # ── 前端跳转路由(模块二硬性要求)─────────────────────────
    route_path = Column(String(200), nullable=True,
                        comment="前端跳转路由,如 /products/1;推荐结果必须携带")

    # ── 区域限制 ──────────────────────────────────────────────
    regions = Column(JSON, nullable=True, comment="可售地区 ['CN','JP','US']")

    # ── 上下架状态 ────────────────────────────────────────────
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    stock     = Column(Integer, nullable=True)

    # ── 扩展 ──────────────────────────────────────────────────
    meta_data = Column(JSON, nullable=True)

    # ── 时间 ──────────────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Product id={self.id} name={self.name!r}>"
