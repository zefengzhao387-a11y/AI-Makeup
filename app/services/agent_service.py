# app/services/agent_service.py
"""
AI 美妆顾问服务
================
调用 DeepSeek LLM API，根据用户肤色、脸型、需求推荐商品。
"""
import json
import logging
from typing import List, Tuple

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, BusinessError
from app.models.product import Product

logger = logging.getLogger(__name__)

_DEEPSEEK_CHAT_URL = f"{settings.DEEPSEEK_BASE_URL.rstrip('/')}/v1/chat/completions"
_TIMEOUT = 35.0

_SYSTEM_PROMPT = """你是一位专业的美妆顾问 AI，名字叫 Lumina。你的任务是根据用户的需求、肤色、脸型等特征，从商品库中推荐最合适的美妆产品。

## 你的能力
- 分析用户的肤色（冷调/暖调/浅色/深色）、脸型（椭圆/圆脸/方脸/心形/长脸）
- 根据用户想要的效果和场景推荐产品
- 解释为什么某款产品适合用户

## 回复格式要求
你的回复必须以 JSON 格式返回，包含以下字段：
{
  "reply": "你的自然语言回复（给用户看的，亲切专业，使用 emoji 点缀，200 字以内）",
  "products": [
    {"id": 商品数字ID, "name": "商品名称", "reason": "推荐理由（简短，15字以内）"}
  ]
}

## 重要规则
- 只推荐商品库中实际存在的商品，用商品 ID 来标识
- 每次推荐 1-5 款商品
- 如果用户的问题和产品推荐无关（比如闲聊），products 可以为空数组
- 回复语气温暖、专业、像闺蜜一样
- 你必须只输出 JSON，不要有任何其他文字"""


async def _fetch_products(db: AsyncSession) -> List[dict]:
    """拉取全部商品，精简为 LLM 可用字段"""
    r = await db.execute(select(Product).limit(200))
    products = r.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "brand": p.brand or "",
            "category": p.category or "",
            "price": int(p.price) if p.price else 0,
            "skin_types": p.skin_types or [],
            "skin_tones": p.skin_tones or [],
            "face_shapes": p.face_shapes or [],
            "tags": p.tags or [],
            "description": (p.description or "")[:100],
        }
        for p in products
    ]


def _build_messages(query: str, history: List[dict], products: List[dict]) -> List[dict]:
    """组装发送给 DeepSeek 的 messages"""
    product_text = json.dumps(products, ensure_ascii=False)

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "system", "content": f"当前商品库（JSON 数组，共 {len(products)} 件）：\n{product_text}"},
    ]

    # 拼接最近历史（最多 10 轮）
    for h in history[-20:]:  # 20 条 = 10 轮
        role = h.get("role", "user")
        content = h.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": query})
    return messages


def _parse_response(text: str) -> Tuple[str, List[dict]]:
    """解析 DeepSeek 返回的 JSON"""
    text = text.strip()
    # 处理可能的 markdown 代码块包裹
    if text.startswith("```"):
        lines = text.split("\n")
        # 去掉首行 ```json 和末行 ```
        end = len(lines) - 1
        if lines[-1].strip() == "```":
            end -= 1
        text = "\n".join(lines[1 : end + 1])

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.warning(f"DeepSeek 返回非 JSON，当作纯文本处理: {text[:200]}")
        return text, []

    reply = str(data.get("reply", "") or "")
    products = []
    for p in data.get("products", []) or []:
        if isinstance(p, dict) and "id" in p:
            products.append({
                "id": int(p["id"]),
                "name": str(p.get("name", "")),
                "reason": str(p.get("reason", "")),
            })
    return reply, products


async def agent_chat(
    query: str,
    history: List[dict],
    db: AsyncSession,
) -> Tuple[str, List[dict]]:
    """美妆顾问对话，返回 (reply, products)"""
    if not settings.DEEPSEEK_API_KEY:
        raise BusinessError(
            message="AI 顾问服务未配置",
            user_action="请在 .env 中配置 DEEPSEEK_API_KEY",
        )

    products = await _fetch_products(db)
    messages = _build_messages(query, history, products)

    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.post(_DEEPSEEK_CHAT_URL, headers=headers, json=payload)
    except httpx.TimeoutException:
        raise ExternalServiceError(message="AI 顾问响应超时，请稍后重试")
    except httpx.NetworkError:
        raise ExternalServiceError(message="网络不稳定，请稍后重试")

    if r.status_code == 429:
        raise ExternalServiceError(
            message="AI 顾问服务繁忙，请稍后再试",
            user_action="约 30 秒后重试",
        )
    if r.status_code != 200:
        logger.error(f"DeepSeek 异常 {r.status_code}: {r.text[:300]}")
        raise ExternalServiceError(
            message="AI 顾问暂时不可用",
            details={"upstream_status": r.status_code},
        )

    body = r.json()
    content = body["choices"][0]["message"]["content"]
    logger.info(f"Agent 对话完成: query={len(query)}字 reply={len(content)}字")
    reply, products = _parse_response(content)
    return reply, products
