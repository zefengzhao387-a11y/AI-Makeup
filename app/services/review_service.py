# app/services/review_service.py
"""商品评论服务"""
import logging
from typing import List, Tuple

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review
from app.models.product import Product
from app.models.user import User
from app.core.exceptions import BusinessError

logger = logging.getLogger(__name__)


async def create_review(
    product_id: int,
    user_id: int,
    rating: int,
    content: str,
    db: AsyncSession,
) -> Review:
    """创建评论，同时更新商品评分"""
    # 检查商品是否存在
    r = await db.execute(select(Product).where(Product.id == product_id))
    product = r.scalar_one_or_none()
    if not product:
        raise BusinessError(message="商品不存在")

    review = Review(
        product_id=product_id,
        user_id=user_id,
        rating=rating,
        content=content.strip(),
    )
    db.add(review)
    await db.flush()

    # 重新计算商品平均评分和评论数
    stats = await db.execute(
        select(
            func.count(Review.id),
            func.avg(Review.rating),
        ).where(Review.product_id == product_id)
    )
    count, avg_rating = stats.one()
    product.review_count = count
    product.rating = round(float(avg_rating), 1) if avg_rating else None
    await db.flush()

    logger.info(f"评论创建: product={product_id} user={user_id} rating={rating}")
    return review


async def get_reviews(
    product_id: int,
    db: AsyncSession,
    limit: int = 50,
) -> List[Tuple[Review, str]]:
    """获取商品评论列表，带用户昵称"""
    r = await db.execute(
        select(Review, User.nickname)
        .outerjoin(User, Review.user_id == User.id)
        .where(Review.product_id == product_id)
        .order_by(desc(Review.created_at))
        .limit(limit)
    )
    return list(r.all())  # [(Review, nickname), ...]
