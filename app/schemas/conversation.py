# app/schemas/conversation.py
"""
对话相关 Schema —— 与《接口说明文档》模块二契约对齐
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ConversationCreateSchema(BaseModel):
    """
    存入一条对话记录(POST /api/conversations)

    与文档示例完全一致:
        {
          "session_id": "550e8400-...",
          "role": "user" | "assistant",
          "content": "...",
          "meta_data": {
            "face_analysis": {"skin_tone": "cool", "face_shape": "oval"},
            "recommended_products": [
              {"id": 1, "name": "...", "route_path": "/products/1"}
            ]
          }
        }
    """
    session_id: str = Field(..., min_length=1, max_length=100,
                            description="会话 ID(UUID 字符串)")
    role:       str = Field(..., pattern=r"^(user|assistant|system)$",
                            description="user / assistant / system")
    content:    str = Field(..., min_length=1, max_length=10000)
    meta_data:  Optional[Dict[str, Any]] = Field(
        None,
        description="附加信息:face_analysis / recommended_products 等",
    )


class ConversationResponse(BaseModel):
    """对话记录单条响应"""
    id:         int
    session_id: str
    role:       str
    content:    str
    meta_data:  Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}
