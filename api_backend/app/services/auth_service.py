from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError

from app.schemas.user import UserCreate
from db.models.user import User, UserRoles
from app.utils.crypto import verify_password, get_password_hash
from app.utils.logger import logger
from app.core.config import config
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse


class AuthService:
    @staticmethod
    async def register_user(user_data: UserCreate, db: AsyncSession):
        try:
            # Check if email already exists
            existing = await db.execute(select(User).where(User.email == user_data.email))
            if existing.scalars().first():
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Also check if username exists (optional but recommended)
            existing_username = await db.execute(select(User).where(User.username == user_data.username))
            if existing_username.scalars().first():
                raise HTTPException(status_code=400, detail="Username already registered")


            # Also check if phone number exists (optional but recommended)
            existing_phone = await db.execute(select(User).where(User.phone_number == user_data.phone_number))
            if existing_phone.scalars().first():
                raise HTTPException(status_code=400, detail="Phone number already registered")

            new_user = User(
                username=user_data.username or user_data.email.split('@')[0], 
                email=user_data.email,
                password=get_password_hash(user_data.password),
                full_name=user_data.full_name,
                phone_number=user_data.phone_number,
                role=user_data.role or UserRoles.USER,
                target_savings_amount=user_data.target_savings_amount or None,
                savings_purpose=user_data.savings_purpose or None,
                income_range=user_data.income_range or None,
                saving_frequency=user_data.saving_frequency or None,
            )

            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            return new_user
        except HTTPException:
            # Re-raise HTTP exceptions (e.g., duplicate email/phone)
            raise
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Could not create user - {str(e)}"
            )



    @staticmethod
    async def authenticate_user(email: str, password: str, db: AsyncSession):
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user or not verify_password(password, user.password):
            return None
        return user

    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=30)):
        to_encode = data.copy()
        expire = datetime.now() + expires_delta
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, config.APP_SECRET_KEY, algorithm=config.ALGORITHM)

    @staticmethod
    def decode_token(token: str):
        try:
            payload = jwt.decode(token, config.APP_SECRET_KEY, algorithms=[config.ALGORITHM])
            return payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid credentials")

# Integrates with phone/email OTP if needed later.