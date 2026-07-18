from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession


from src.domains.users.models import User 



class UserKYCFlager():

    def __init__(self, db: AsyncSession) -> None:
            self._db = db

    async def set_kyc_verified(self, user_id, verified: bool) -> None:
        await self._db.execute(
            update(User).where(User.id == user_id).values(kyc_verified=verified)
        )
        await self._db.commit()