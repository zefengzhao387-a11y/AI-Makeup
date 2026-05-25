# app/schemas/review.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewCreateSchema(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="评分 1-5")
    content: str = Field(..., min_length=1, max_length=1000, description="评论内容")


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: Optional[int]
    nickname: Optional[str]
    rating: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
