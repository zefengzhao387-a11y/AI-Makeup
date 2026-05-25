# app/routers/conversations.py
"""
模块三 · 对话存取接口（给模块二 Agent 用）
==========================================
POST /api/conversations              存入一条消息
GET  /api/conversations?session_id=  按 session_id 取历史（时间正序）

模块二 Agent 通过这两个接口实现"上下文记忆"。
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc

from app.core.database import get_db
from app.core.exceptions import AuthError, TokenExpiredError
from app.core.security import decode_access_token
from app.models.conversation import Conversation, ConversationSession
from app.schemas.conversation import ConversationCreateSchema, ConversationResponse

router = APIRouter()


# ── 共享鉴权依赖 ────────────────────────────────────────────
async def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """从 Authorization 头解析出 user_id。所有受保护接口都用它做依赖。"""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError(message="未携带 Token", user_action="请先登录")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
        return int(payload["user_id"])
    except AuthError:
        raise
    except Exception:
        raise TokenExpiredError(message="Token 已过期或无效")


@router.post(
    "",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="存入一条对话记录",
)
async def create_conversation(
    body: ConversationCreateSchema,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # 若 session 不存在则自动创建（保证外键完整）
    r = await db.execute(
        select(ConversationSession).where(ConversationSession.session_id == body.session_id)
    )
    if r.scalar_one_or_none() is None:
        db.add(ConversationSession(
            session_id=body.session_id,
            user_id=user_id,
            title="新对话",
        ))
        await db.flush()

    msg = Conversation(
        user_id=user_id,
        session_id=body.session_id,
        role=body.role,
        content=body.content,
        meta_data=body.meta_data,
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return msg


@router.get(
    "",
    response_model=List[ConversationResponse],
    summary="按 session_id 取历史消息（时间正序）",
)
async def list_conversations(
    session_id: str = Query(..., description="会话 ID，必填"),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """仅返回当前用户自己的消息；别人的 session_id 查不到。"""
    r = await db.execute(
        select(Conversation)
        .where(Conversation.session_id == session_id)
        .where(Conversation.user_id == user_id)
        .order_by(asc(Conversation.created_at))
    )
    return r.scalars().all()
