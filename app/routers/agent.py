# app/routers/agent.py
"""
AI 美妆顾问接口
================
POST /api/agent/chat  美妆顾问对话（LLM 驱动）
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.exceptions import HTTPException

from app.core.database import get_db
from app.routers.conversations import get_current_user_id
from app.schemas.agent import AgentChatRequest, AgentChatResponse, RecommendedProduct
from app.services.agent_service import agent_chat
from app.core.exceptions import AppException

router = APIRouter()


@router.post(
    "/chat",
    response_model=AgentChatResponse,
    summary="AI 美妆顾问对话",
)
async def agent_chat_endpoint(
    body: AgentChatRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    history = [{"role": m.role, "content": m.content} for m in body.history]
    try:
        reply, products = await agent_chat(
            query=body.query,
            history=history,
            db=db,
        )
    except AppException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI 顾问服务暂时不可用，请稍后重试")

    return AgentChatResponse(
        reply=reply,
        products=[RecommendedProduct(**p) for p in products],
    )
