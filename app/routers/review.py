# app/routers/review.py
"""
商品评论接口
============
GET  /api/products/{product_id}/reviews   获取评论列表（公开）
POST /api/products/{product_id}/reviews   提交评论（需登录）
"""
from typing import List

from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.routers.conversations import get_current_user_id
from app.schemas.review import ReviewCreateSchema, ReviewResponse
from app.services import review_service

router = APIRouter()


@router.get(
    "/{product_id}/reviews",
    response_model=List[ReviewResponse],
    summary="获取商品评论",
)
async def list_reviews(
    product_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
):
    rows = await review_service.get_reviews(product_id, db)
    return [
        ReviewResponse(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            nickname=nick,
            rating=r.rating,
            content=r.content,
            created_at=r.created_at,
        )
        for r, nick in rows
    ]


@router.post(
    "/{product_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="提交商品评论",
)
async def create_review(
    body: ReviewCreateSchema,
    product_id: int = Path(..., ge=1),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    r = await review_service.create_review(
        product_id=product_id,
        user_id=user_id,
        rating=body.rating,
        content=body.content,
        db=db,
    )
    return ReviewResponse(
        id=r.id,
        product_id=r.product_id,
        user_id=r.user_id,
        nickname=None,
        rating=r.rating,
        content=r.content,
        created_at=r.created_at,
    )
