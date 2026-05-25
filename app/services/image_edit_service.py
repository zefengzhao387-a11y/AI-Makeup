# app/services/image_edit_service.py
"""
模块一：AI 图像编辑（Google Gemini）
=====================================
保留完整接口契约：
- 输入：Data URL / https URL / 裸 Base64
- 输出：PNG 二进制
- 限制：图片 ≤ 15MB；调用超时 55s
"""
import base64
import time
from typing import Tuple

import httpx
import logging

from app.core.config import settings
from app.core.exceptions import BusinessError, ExternalServiceError, SystemError

logger = logging.getLogger(__name__)

_MODEL = "gemini-2.5-flash-image"
_GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{_MODEL}:generateContent"
_MAX_IMAGE_BYTES = 15 * 1024 * 1024
_TIMEOUT = 55.0


class ImageEditService:

    @staticmethod
    async def edit(
        original_image: str,
        edit_prompt: str,
        strength: float = 0.55,
    ) -> bytes:
        """编辑图片，返回 PNG 二进制"""
        if not settings.GEMINI_API_KEY:
            raise SystemError(
                message="服务未配置图像编辑能力",
                user_action="请在 .env 中配置 GEMINI_API_KEY",
            )
        if not edit_prompt or not edit_prompt.strip():
            raise BusinessError(
                message="编辑指令不能为空",
                user_action="请输入对图片的编辑描述",
            )

        strength = max(0.0, min(1.0, strength))
        image_bytes, media_type = await ImageEditService._resolve_image(original_image)

        start = time.perf_counter()
        png = await ImageEditService._call_gemini(image_bytes, media_type, edit_prompt, strength)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            f"图像编辑完成: prompt={len(edit_prompt)}字 / "
            f"in={len(image_bytes)//1024}KB / out={len(png)//1024}KB / {elapsed_ms}ms"
        )
        return png

    # ── 解析图片入参 ─────────────────────────────────────────
    @staticmethod
    async def _resolve_image(src: str) -> Tuple[bytes, str]:
        src = (src or "").strip()
        if not src:
            raise BusinessError(message="original_image 不能为空")

        if src.startswith("data:"):
            try:
                header, b64 = src.split(",", 1)
                media_type = header.split(":")[1].split(";")[0]
                image_bytes = base64.b64decode(b64)
            except Exception as e:
                raise BusinessError(
                    message="Data URL 无法解析",
                    user_action="请确认是 data:image/...;base64,xxx 格式",
                ) from e

        elif src.startswith("https://"):
            try:
                async with httpx.AsyncClient(timeout=15.0) as c:
                    r = await c.get(src)
                if r.status_code != 200:
                    raise BusinessError(message=f"图片 URL 下载失败 HTTP {r.status_code}")
                image_bytes = r.content
                media_type = r.headers.get("content-type", "image/jpeg").split(";")[0].strip()
            except httpx.TimeoutException as e:
                raise ExternalServiceError(message="图片下载超时") from e
            except BusinessError:
                raise
            except Exception as e:
                raise BusinessError(message="图片 URL 下载失败") from e

        elif src.startswith("http://"):
            raise BusinessError(
                message="不支持 http:// 图片 URL",
                user_action="请改用 https:// 或上传图片",
            )

        else:
            # 裸 base64
            try:
                image_bytes = base64.b64decode(src)
                media_type = "image/jpeg"
            except Exception as e:
                raise BusinessError(
                    message="original_image 格式无法识别",
                    user_action="请传入 Data URL / https URL / 裸 Base64",
                ) from e

        if len(image_bytes) > _MAX_IMAGE_BYTES:
            raise BusinessError(
                message=f"图片过大（{len(image_bytes)//1024//1024} MB），上限 15 MB",
                user_action="请压缩后再上传",
            )
        return image_bytes, media_type

    # ── 调用 Gemini ──────────────────────────────────────────
    @staticmethod
    async def _call_gemini(
        image_bytes: bytes, media_type: str, prompt: str, strength: float,
    ) -> bytes:
        """调用 Gemini 图像编辑 API"""
        # 将 strength 转为提示词强度描述
        if strength <= 0.35:
            intensity = "very subtle, barely noticeable"
        elif strength <= 0.50:
            intensity = "natural and subtle"
        elif strength <= 0.65:
            intensity = "moderate and visible"
        else:
            intensity = "bold and dramatic"

        full_prompt = f"{prompt}. Make the effect {intensity}. Preserve the person's identity and facial structure. Output a photorealistic image."

        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        url = f"{_GEMINI_ENDPOINT}?key={settings.GEMINI_API_KEY}"

        payload = {
            "contents": [{
                "parts": [
                    {"text": full_prompt},
                    {"inlineData": {"mimeType": media_type, "data": b64_image}},
                ]
            }],
            "generationConfig": {
                "responseModalities": ["IMAGE", "TEXT"],
            },
        }

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
                r = await c.post(url, json=payload)
        except httpx.TimeoutException:
            raise ExternalServiceError(message="图像生成超时，请简化指令后重试")
        except httpx.NetworkError:
            raise ExternalServiceError(message="网络不稳定，请稍后重试")

        if r.status_code == 429:
            raise ExternalServiceError(
                message="图像服务繁忙，请稍后再试",
                user_action="约 30 秒后重试",
            )
        if r.status_code != 200:
            logger.error(f"Gemini 异常 {r.status_code}: {r.text[:300]}")
            upstream_msg = ""
            try:
                body = r.json()
                upstream_msg = body.get("error", {}).get("message", "")
            except Exception:
                pass
            user_msg = f"图片编辑失败：{upstream_msg}" if upstream_msg else "图像编辑失败"
            raise ExternalServiceError(
                message=user_msg,
                details={"upstream_status": r.status_code},
            )

        # 解析 Gemini 响应，提取生成的图片
        body = r.json()
        candidates = body.get("candidates", [])
        if not candidates:
            raise ExternalServiceError(message="图像生成失败：模型未返回结果")

        parts = candidates[0].get("content", {}).get("parts", [])
        for part in parts:
            inline = part.get("inlineData")
            if inline and inline.get("data"):
                img_b64 = inline["data"]
                return base64.b64decode(img_b64)

        raise ExternalServiceError(message="图像生成失败：响应中未找到图片")
