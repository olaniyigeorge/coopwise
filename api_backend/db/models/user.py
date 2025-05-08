from datetime import datetime
from uuid import uuid4
from db.database import Base
from sqlalchemy import Column, String, Enum, DateTime
from sqlalchemy.orm import relationship
import enum

# Enum for User Roles
class UserRoles(enum.Enum):
    ADMIN = "admin"
    USER = "user"


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()), index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRoles), default=UserRoles.USER)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    # cooperatives = relationship("CooperativeGroup", back_populates="user")
