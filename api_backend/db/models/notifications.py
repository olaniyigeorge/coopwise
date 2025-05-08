
from datetime import datetime
from uuid import UUID
from db.database import Base


class Notification(Base):
    id: UUID
    user_id: UUID
    message: str
    notification_type: str  # reminder, alert, AI_tip
    status: str  # unread, read
    created_at: datetime
