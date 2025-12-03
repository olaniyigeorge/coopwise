from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError

from app.schemas.user import UserCreate, UserDetail, iAuthWallet
from db.models.user import User, UserRoles
from db.models.wallet_models import OnChainWallet
from app.utils.crypto import verify_password, get_password_hash
from app.utils.logger import logger
from app.core.config import AppConfig as config
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse



class AuthService:
    @staticmethod
    async def register_user(user_data: UserCreate, db: AsyncSession):
        try:
            # Check if email already exists
            existing = await db.execute(
                select(User).where(User.email == user_data.email)
            )
            if existing.scalars().first():
                raise HTTPException(status_code=400, detail="Email already registered")

            # Also check if username exists (optional but recommended)
            existing_username = await db.execute(
                select(User).where(User.username == user_data.username)
            )
            if existing_username.scalars().first():
                raise HTTPException(
                    status_code=400, detail="Username already registered"
                )

            # Also check if phone number exists (optional but recommended)
            existing_phone = await db.execute(
                select(User).where(User.phone_number == user_data.phone_number)
            )
            if existing_phone.scalars().first():
                raise HTTPException(
                    status_code=400, detail="Phone number already registered"
                )

            new_user = User(
                username=user_data.username or user_data.email.split("@")[0],
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
                detail=f"Could not create user - {str(e)}",
            )

    @staticmethod
    async def authenticate_user(email: str, password: str, db: AsyncSession):
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user or not verify_password(password, user.password):
            return None
        return user

    @staticmethod
    async def create_access_token(
        data: dict, expires_delta: timedelta = timedelta(minutes=30)
    ):
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, config.APP_SECRET_KEY, algorithm=config.ALGORITHM)

    @staticmethod
    async def decode_token(token: str):
        try:
            payload = jwt.decode(
                token, config.APP_SECRET_KEY, algorithms=[config.ALGORITHM]
            )
            return payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    @staticmethod
    async def create_password_reset_token(
        user: User, expires_delta: timedelta = timedelta(minutes=15)
    ) -> str:
        data = {
            "sub": user.email,
            "id": str(user.id),
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
            "type": "reset",
        }
        expire = datetime.now(timezone.utc) + expires_delta
        logger.info(f"Token will expire at: {expire}")
        data.update({"exp": expire})
        return jwt.encode(data, config.APP_SECRET_KEY, algorithm=config.ALGORITHM)

    @staticmethod
    async def send_reset_password_link(email: str, db: AsyncSession):
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user:
            raise HTTPException(
                status_code=404, detail="User with this email does not exist"
            )

        token = await AuthService.create_password_reset_token(user)
        reset_link = f"{config.CLIENT_DOMAIN}/reset-password?token={token}"

        # Send email (assuming send_email utility works)
        # await send_email(
        #     to=user.email,
        #     subject="Reset Your Password",
        #     body=f"Click the link to reset your password: {reset_link}"
        # )
        logger.info(f"\nToken: {token}\n")
        return {"message": "Password reset link has been sent to your email"}

    @staticmethod
    async def confirm_reset_token(token: str):
        try:
            payload = jwt.decode(
                token, config.APP_SECRET_KEY, algorithms=[config.ALGORITHM]
            )
            if payload.get("type") != "reset":
                raise HTTPException(status_code=400, detail="Invalid token type")
            if "exp" in payload and datetime.fromtimestamp(
                payload["exp"], tz=timezone.utc
            ) < datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Token has expired")
            return payload
        except JWTError as e:
            raise HTTPException(status_code=401, detail="Invalid or expired token")


    @staticmethod
    async def camp_sync(data: iAuthWallet, db: AsyncSession):
        try:
            wallet_address = data.wallet_address
            if not wallet_address:
                raise HTTPException(status_code=400, detail="wallet_address is required")

            wallet_address = wallet_address.strip().lower()

            # Try to resolve user if user_id provided
            user = None
            user_id = data.user_id
            if user_id:
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalars().first()

            # Check existing on-chain wallet
            result = await db.execute(
                select(OnChainWallet).where(OnChainWallet.wallet_address == wallet_address)
            )
            onchain_wallet = result.scalars().first()

            # Create on-chain wallet if it doesn't exist
            if not onchain_wallet:
                onchain_wallet = OnChainWallet(wallet_address=wallet_address)
                if user:
                    onchain_wallet.user_id = user.id
                db.add(onchain_wallet)
                await db.commit()
                await db.refresh(onchain_wallet)
            else:
                # If wallet exists but isn't linked and we have a user, link them
                if user and data.user_id != user.id:
                    onchain_wallet.user_id = user.id
                    db.add(onchain_wallet)
                    await db.commit()
                    await db.refresh(onchain_wallet)

            
            # If we still don't have a user, create one with the user_id from wallet, wallet address as username etc
            if not user:
                user = User(
                    id=data.user_id,
                    username=f"user_{wallet_address[:8]}",
                    email=f"{wallet_address.lower()}@wallet.coopwise.com", 
                    password=get_password_hash(uuid4().hex),
                    full_name=f"Camp User {wallet_address}",
                    phone_number="+0000000000",
                    role=UserRoles.user,
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)


            # If we have a user, create an access token to return
            token = None
            if user:
                token = await AuthService.create_access_token(
                    {"sub": user.email, "id": str(user.id), "role": user.role.value},
                    expires_delta=timedelta(hours=24),
                )

            return {"user": {"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role.value}, "wallet": {"id": onchain_wallet.id, "wallet_address": onchain_wallet.wallet_address, "connected_at": onchain_wallet.connected_at}, "token": token}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in camp_sync: {e}")
            raise HTTPException(status_code=500, detail="Could not sync wallet")


    @staticmethod
    async def change_password(token: str, new_password: str, db: AsyncSession):
        try:
            payload = await AuthService.confirm_reset_token(token)
            user_id = UUID(payload.get("id"))

            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalars().first()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            user.password = get_password_hash(new_password)
            db.add(user)
            await db.commit()
            return {
                "status": "success",
                "message": "Password changed successfully",
                "user": user,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            raise HTTPException(
                status_code=500, detail="Something went wrong. Try again later."
            )


# Integrates with phone/email OTP if needed later.
