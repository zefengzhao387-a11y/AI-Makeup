# app/routers/makeup.py
"""
化妆 AI 试妆接口
================
GET  /api/makeup/styles   获取预设妆容风格列表
POST /api/makeup/try-on   上传照片试妆，返回 PNG
"""
from typing import List

from fastapi import APIRouter
from fastapi.responses import Response

from app.schemas.makeup import MakeupStyleResponse, MakeupTryOnRequest
from app.services.makeup_service import MakeupService

router = APIRouter()


@router.get(
    "/styles",
    response_model=List[MakeupStyleResponse],
    summary="获取预设妆容风格",
)
async def list_makeup_styles():
    return MakeupService.list_styles()


@router.post(
    "/try-on",
    summary="AI 化妆试妆",
    responses={200: {"content": {"image/png": {}}, "description": "试妆后的 PNG 图像"}},
)
async def makeup_try_on(body: MakeupTryOnRequest):
    png, _, strength = await MakeupService.try_on(
        original_image=body.original_image,
        style=body.style,
        prompt=body.prompt,
        strength=body.strength,
    )
    return Response(
        content=png,
        media_type="image/png",
        headers={
            "Cache-Control": "no-store",
            "X-Makeup-Strength": str(strength),
            **({"X-Makeup-Style": body.style} if body.style else {}),
        },
    )
