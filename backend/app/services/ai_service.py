
from sqlalchemy.ext.asyncio import AsyncSession




class EventService:
    def __init__(self, db: AsyncSession):
        self.db = db