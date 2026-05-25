# app/schemas/makeup.py
from pydantic import BaseModel, Field, model_validator
from typing import Optional, List


class MakeupStyleResponse(BaseModel):
    id: str
    name: str
    name_en: str
    description: str


class MakeupTryOnRequest(BaseModel):
    original_image: str = Field(..., description="原图（Data URL / https URL / 裸 Base64）")
    style: Optional[str] = Field(None, description="预设妆容风格 ID，见 GET /api/makeup/styles")
    prompt: Optional[str] = Field(None, description="自定义妆容描述，可与 style 组合")
    strength: Optional[float] = Field(None, ge=0.0, le=1.0, description="编辑强度，默认随风格或 0.45")

    @model_validator(mode="after")
    def require_style_or_prompt(self):
        if not (self.style or (self.prompt and self.prompt.strip())):
            raise ValueError("style 与 prompt 至少填写一项")
        return self
