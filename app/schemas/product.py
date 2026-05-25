# app/schemas/product.py
"""
商品 Schema —— 与《接口说明文档》模块二契约对齐
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProductCreateSchema(BaseModel):
    name:        str = Field(..., max_length=200)
    brand:       Optional[str]            = None
    category:    Optional[str]            = None
    subcategory: Optional[str]            = None
    price:       Optional[float]          = None
    description: Optional[str]            = None
    ingredients: Optional[str]            = None
    usage_tips:  Optional[str]            = None
    image_url:   Optional[str]            = None
    images:      Optional[List[str]]      = None
    skin_types:  Optional[List[str]]      = None
    skin_tones:  Optional[List[str]]      = None
    face_shapes: Optional[List[str]]      = None
    tags:        Optional[List[str]]      = None
    route_path:  Optional[str]            = None
    meta_data:   Optional[Dict[str, Any]] = None


class ProductResponse(BaseModel):
    """商品列表项 —— 字段顺序和命名严格对齐契约文档

    注：subcategory / description / ingredients / usage_tips / images 原本
    属于详情接口，但前端列表卡片也用到了它们（点击直接展示，不再请求详情），
    所以列表 Response 也带上这些字段，避免点开商品时一片空白。
    """
    id:          int
    name:        str
    brand:       Optional[str]       = None
    category:    Optional[str]       = None
    subcategory: Optional[str]       = None
    price:       Optional[float]     = None
    description: Optional[str]       = None
    ingredients: Optional[str]       = None
    usage_tips:  Optional[str]       = None
    image_url:   Optional[str]       = None
    images:      Optional[List[str]] = None
    tags:        Optional[List[str]] = None
    skin_types:  Optional[List[str]] = None
    skin_tones:  Optional[List[str]] = None
    face_shapes: Optional[List[str]] = None
    route_path:  Optional[str]       = None
    created_at:  datetime

    model_config = {"from_attributes": True}


class ProductDetailResponse(ProductResponse):
    """商品详情 —— 与列表一致 + meta_data"""
    meta_data: Optional[Dict[str, Any]] = None
