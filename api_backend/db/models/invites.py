
from datetime import datetime
from uuid import UUID
from db.database import Base



class Invite(Base):
    id: UUID
    group_id: UUID
    invited_by: UUID  # FK to User
    invitee_phone_or_email: str
    status: str  # pending, accepted, expired
    created_at: datetime
