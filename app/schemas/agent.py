# app/schemas/agent.py
from pydantic import BaseModel, Field
from typing import List, Optional


class ChatMsg(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class RecommendedProduct(BaseModel):
    id: int
    name: str
    reason: str = ""


class AgentChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="用户问题")
    session_id: str = Field(..., description="会话 ID")
    history: List[ChatMsg] = Field(default_factory=list, description="最近对话历史（最多 10 轮）")


class AgentChatResponse(BaseModel):
    reply: str
    products: List[RecommendedProduct] = []
