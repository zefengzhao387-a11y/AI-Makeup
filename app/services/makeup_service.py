# app/services/makeup_service.py
"""
化妆 AI 试妆服务
=================
在通用图像编辑能力之上，封装妆容风格预设与 prompt 增强。
"""
from typing import List, Optional, Tuple

from app.core.exceptions import BusinessError
from app.services.image_edit_service import ImageEditService

# 预设妆容：id / 展示名 / 英文 prompt 片段 / 默认 strength
_MAKEUP_STYLES: List[dict] = [
    {
        "id": "natural",
        "name": "自然淡妆",
        "name_en": "Natural",
        "description": "轻薄底妆，裸色唇妆，日常通勤",
        "prompt": (
            "Apply natural everyday makeup on this face photo: "
            "light dewy foundation, soft brown eyeshadow, thin mascara, "
            "nude pink lipstick, natural groomed eyebrows. "
            "Keep facial features and identity unchanged, photorealistic."
        ),
        "strength": 0.42,
    },
    {
        "id": "office",
        "name": "职场干练",
        "name_en": "Office",
        "description": "精致底妆，大地色眼影，豆沙唇",
        "prompt": (
            "Apply polished office makeup: medium coverage matte foundation, "
            "taupe brown eyeshadow, subtle eyeliner, rose mauve lipstick, "
            "defined brows. Professional and clean look, preserve face identity."
        ),
        "strength": 0.45,
    },
    {
        "id": "date",
        "name": "约会甜美",
        "name_en": "Date Night",
        "description": "柔光肌，粉色腮红，水润唇釉",
        "prompt": (
            "Apply romantic date-night makeup: glowing skin, soft pink blush, "
            "shimmer eyeshadow, fluttery lashes, glossy coral pink lips. "
            "Sweet and feminine, keep the person recognizable."
        ),
        "strength": 0.48,
    },
    {
        "id": "party",
        "name": "派对烟熏",
        "name_en": "Party Glam",
        "description": "立体修容，烟熏眼妆，正红唇",
        "prompt": (
            "Apply glamorous party makeup: contoured cheeks, smoky eye makeup, "
            "bold winged eyeliner, voluminous lashes, classic red lipstick. "
            "High fashion evening look, preserve original face structure."
        ),
        "strength": 0.52,
    },
    {
        "id": "korean",
        "name": "韩系清透",
        "name_en": "K-Beauty",
        "description": "水光肌，渐变唇，根根分明睫毛",
        "prompt": (
            "Apply Korean glass-skin makeup: luminous dewy base, gradient lip tint, "
            "straight soft brows, subtle aegyo-sal highlight, natural curled lashes. "
            "Fresh K-beauty aesthetic, identity unchanged."
        ),
        "strength": 0.44,
    },
]

_STYLE_MAP = {s["id"]: s for s in _MAKEUP_STYLES}


class MakeupService:

    @staticmethod
    def list_styles() -> List[dict]:
        return [
            {
                "id": s["id"],
                "name": s["name"],
                "name_en": s["name_en"],
                "description": s["description"],
            }
            for s in _MAKEUP_STYLES
        ]

    @staticmethod
    def _resolve(style: Optional[str], prompt: Optional[str], strength: Optional[float]) -> Tuple[str, float]:
        parts: List[str] = []
        resolved_strength = strength

        if style:
            preset = _STYLE_MAP.get(style.strip())
            if not preset:
                valid = ", ".join(_STYLE_MAP.keys())
                raise BusinessError(
                    message=f"未知妆容风格「{style}」",
                    user_action=f"请使用 GET /api/makeup/styles 查看可用风格：{valid}",
                )
            parts.append(preset["prompt"])
            if resolved_strength is None:
                resolved_strength = preset["strength"]

        user_prompt = (prompt or "").strip()
        if user_prompt:
            parts.append(user_prompt)

        if resolved_strength is None:
            resolved_strength = 0.45

        full_prompt = ". ".join(parts)
        return full_prompt, max(0.0, min(1.0, resolved_strength))

    @staticmethod
    async def try_on(
        original_image: str,
        style: Optional[str] = None,
        prompt: Optional[str] = None,
        strength: Optional[float] = None,
    ) -> Tuple[bytes, str, float]:
        """试妆，返回 (PNG 二进制, 最终 prompt, strength)"""
        edit_prompt, resolved_strength = MakeupService._resolve(style, prompt, strength)
        png = await ImageEditService.edit(
            original_image=original_image,
            edit_prompt=edit_prompt,
            strength=resolved_strength,
        )
        return png, edit_prompt, resolved_strength
