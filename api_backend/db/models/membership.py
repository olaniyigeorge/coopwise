from datetime import datetime
from uuid import UUID
from db.database import Base





class GroupMembership(Base):
    id: UUID
    user_id: UUID  # FK to User
    group_id: UUID  # FK to CooperativeGroup
    role: str  # member, admin
    join_status: str  # pending, accepted
    join_date: datetime