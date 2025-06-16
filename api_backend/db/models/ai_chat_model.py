from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from db.database import Base
from sqlalchemy import Column, Text


class ChatWithAI(Base):
    __tablename__ = "chat_with_ai"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    body = Column(Text, nullable=False)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
   

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    user = relationship("User", back_populates="ai_chats")