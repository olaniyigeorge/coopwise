from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from db.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.crypto import get_password_hash, verify_password
from app.utils.logger import logger


class UserService:

    @staticmethod
    async def get_users(db: AsyncSession, skip: int = 0, limit: int = 10) -> list[User]:
        """
        Fetch a list of users with optional pagination.
        """
        try:
            result = await db.execute(select(User).offset(skip).limit(limit))
            users = result.scalars().all()
        except Exception as e:
            logger.error(f"Failed to fetch users: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch users"
            )
            # raise HTTPException(status_code=401, detail="Invalid login credentials")
        return users
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
        """
        Fetch a single user by ID.
        """
        try:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalars().first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return user
        except Exception as e:
            logger.error(f"Failed to fetch user by ID: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch user"
            )

    @staticmethod
    async def update_user(db: AsyncSession, user_id: str, user_data: UserUpdate) -> User | None:
        """
        Update a user's details by their ID.
        """
        try:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalars().first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Update user fields
            print(user_data)
            for field, value in user_data.dict(exclude_unset=True).items():
                print(f"Updating {field} to {value}")
                setattr(user, field, value)

            await db.commit()
            await db.refresh(user)
        except Exception as e:
            logger.error(f"Failed to update user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update user"
            )
        return user

    @staticmethod
    async def register_user(user_data: UserCreate, db: AsyncSession) -> User:
        """
        Register a new user with hashed password. Fails if email is already in use.
        """
        try:
            result = await db.execute(select(User).where(User.email == user_data.email))
            if result.scalars().first():
                raise HTTPException(status_code=400, detail="Email already registered")

            new_user = User(
                username=user_data.username,
                email=user_data.email,
                password=get_password_hash(user_data.password)
            )

            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            return new_user

        except Exception as e:
            logger.error(f"User registration failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create user"
            )

    @staticmethod
    async def authenticate_user(email: str, password: str, db: AsyncSession) -> User | None:
        """
        Authenticate a user by email and password. Returns user if valid, else None.
        """
        try:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalars().first()

            if not user or not verify_password(password, user.password):
                return None

            return user

        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return None

    @staticmethod
    async def verify_user(user_id: str, db: AsyncSession) -> bool:
        """
        Verifies user by checking:
        - Email is verified
        - Verification video submitted and processed
        - Phone OTP passed
        - Wallet activated (e.g. has a first deposit)
        """
        try:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalars().first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            verified = all([
                user.is_email_verified,
                user.is_video_verified,
                user.is_phone_verified,
                user.wallet_activated
            ])

            return verified
        except Exception as e:
            logger.error(f"User verification check failed: {e}")
            raise HTTPException(
                status_code=500,
                detail="Verification process failed"
            )

    @staticmethod
    async def kyc(
            user_id: str,
            db: AsyncSession,
            *,
            video_verified: bool = False,
            email_verified: bool = False,
            wallet_activated: bool = False
        ) -> dict:
            """
            Perform and update user verification fields as part of KYC.
            Sets is_verified=True if all criteria are met.
            """
            try:
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalars().first()

                if not user:
                    raise HTTPException(status_code=404, detail="User not found")

                # Update verification flags
                user.is_video_verified = video_verified or user.is_video_verified
                user.is_email_verified = email_verified or user.is_email_verified
                user.wallet_activated = wallet_activated or user.wallet_activated

                # Set overall verification flag
                user.is_verified = all([
                    user.is_email_verified,
                    user.is_video_verified,
                    user.wallet_activated
                ])

                await db.commit()
                await db.refresh(user)

                return {
                    "status": "success",
                    "is_verified": user.is_verified,
                    "details": {
                        "is_email_verified": user.is_email_verified,
                        "is_video_verified": user.is_video_verified,
                        "wallet_activated": user.wallet_activated
                    }
                }

            except Exception as e:
                logger.error(f"KYC update failed: {e}")
                await db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="KYC update failed"
                )
