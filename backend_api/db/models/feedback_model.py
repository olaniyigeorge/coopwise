from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String

from db.database import Base


class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, index=True, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )
