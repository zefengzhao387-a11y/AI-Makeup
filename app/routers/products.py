# app/routers/products.py
"""
模块三 · 商品接口
==================
GET /api/products              商品列表（模块二 Agent 拉全量做 RAG 数据源）
GET /api/products/{id}         商品详情
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError
from app.models.product import Product
from app.schemas.product import ProductResponse, ProductDetailResponse
from app.routers.conversations import get_current_user_id

router = APIRouter()


@router.get(
    "",
    response_model=List[ProductResponse],
    summary="获取商品列表",
    description="供前端展示与 Agent 做 RAG 数据源使用。",
)
async def list_products(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
    category: Optional[str] = Query(None, description="一级分类筛选（Lips/Face/Eyes/Skincare）"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
):
    stmt = select(Product).where(Product.is_active == True)  # noqa: E712
    if category:
        stmt = stmt.where(Product.category == category)
    stmt = stmt.offset(skip).limit(limit)
    r = await db.execute(stmt)
    products = r.scalars().all()

    # 补默认 route_path，确保 Agent 始终能拿到跳转地址
    for p in products:
        if not p.route_path:
            p.route_path = f"/products/{p.id}"
    return products


@router.get(
    "/{product_id}",
    response_model=ProductDetailResponse,
    summary="获取商品详情",
)
async def get_product(
    product_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(Product).where(Product.id == product_id))
    product = r.scalar_one_or_none()
    if product is None:
        raise ResourceNotFoundError(message=f"商品 {product_id} 不存在")
    if not product.route_path:
        product.route_path = f"/products/{product.id}"
    return product
