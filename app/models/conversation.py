# app/models/conversation.py
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(Integer, primary_key=True, autoincrement=True)

    # ── 归属 ──────────────────────────────────────────────────
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True, comment="一次连续对话的唯一ID（UUID）")

    # ── 消息内容 ──────────────────────────────────────────────
    role       = Column(String(20),  nullable=False, comment="user / assistant / system")
    content    = Column(Text,        nullable=False, comment="消息文本内容")

    # ── 附加信息 ──────────────────────────────────────────────
    # 例如：{"image_url": "...", "recommended_products": [1,2,3], "type": "skin_analysis"}
    meta_data  = Column(JSON, nullable=True, comment="附加数据：图片URL、推荐商品等")

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Conversation id={self.id} session={self.session_id} role={self.role}>"


class ConversationSession(Base):
    """会话元数据表：一个 session 的汇总信息"""
    __tablename__ = "conversation_sessions"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), unique=True, nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title      = Column(String(200), nullable=True, comment="对话标题（AI自动生成）")
    summary    = Column(Text, nullable=True,        comment="对话摘要（AI自动生成）")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())