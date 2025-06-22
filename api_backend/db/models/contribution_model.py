from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String, Numeric, Enum as SQLAlchemyEnum, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from db.database import Base


class ContributionStatus(Enum):
    PLEDGED = "pledged"     
    PENDING = "pending"      
    COMPLETED = "completed" 
    FAILED = "failed"       
    CANCELLED = "cancelled"  


class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4, index=True)

    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    group_id = Column(PGUUID(as_uuid=True), ForeignKey("cooperative_groups.id"), nullable=False)
    wallet_ledger = Column(PGUUID(as_uuid=True), ForeignKey("wallet_ledgers.id"), nullable=True)   
    
     
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="NGN", nullable=False)

    due_date = Column(DateTime, nullable=True)  # for scheduled contributions
    fulfilled_at = Column(DateTime, nullable=True) 

    status = Column(SQLAlchemyEnum(ContributionStatus), default=ContributionStatus.PLEDGED, nullable=False)
    note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    user = relationship("User", back_populates="contributions")
    group = relationship("CooperativeGroup", back_populates="contributions")
    wallet_ledger = relationship("WalletLedger", back_populates="contribution", uselist=False)
