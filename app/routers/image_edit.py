# app/routers/image_edit.py
"""
模块一 · AI 图像编辑接口
========================
POST /api/image-edit          上传图片 + 编辑指令，返回 PNG
"""
from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import Optional

from app.services.image_edit_service import ImageEditService

router = APIRouter()


class ImageEditRequest(BaseModel):
    original_image: str = Field(..., description="原图（Data URL / https URL / 裸 Base64）")
    edit_prompt:    str = Field(..., description="自然语言编辑指令")
    strength:       Optional[float] = Field(0.55, ge=0.0, le=1.0, description="0~1，越大越偏离原图")


@router.post(
    "/image-edit",
    summary="AI 图像编辑（Stability AI SD3）",
    responses={200: {"content": {"image/png": {}}, "description": "编辑后的 PNG 图像"}},
)
async def image_edit(body: ImageEditRequest):
    png = await ImageEditService.edit(
        original_image=body.original_image,
        edit_prompt=body.edit_prompt,
        strength=body.strength,
    )
    return Response(content=png, media_type="image/png", headers={"Cache-Control": "no-store"})
