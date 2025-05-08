from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError

from app.schemas.user import UserCreate
from db.models.user import User
from app.utils.crypto import verify_password, get_password_hash
from app.utils.logger import logger
from app.core.config import config
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse


class AuthService:
    @staticmethod
    async def register_user(user_data: UserCreate, db: AsyncSession):
        try:
            existing = await db.execute(select(User).where(User.email == user_data.email))
            if existing.scalars().first():
                raise HTTPException(status_code=400, detail="Email already registered")
            
            new_user = User(
                username=user_data.username,
                email=user_data.email,
                password=get_password_hash(user_data.password)
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Could not create user - {str(e)}"
            )
        return new_user 

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
        print(f"\n\nToken data: {to_encode}\n\n")
        return jwt.encode(to_encode, config.APP_SECRET_KEY, algorithm=config.ALGORITHM)

    @staticmethod
    def decode_token(token: str):
        try:
            payload = jwt.decode(token, config.APP_SECRET_KEY, algorithms=[config.ALGORITHM])
            return payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid credentials")

# Integrates with phone/email OTP if needed later.