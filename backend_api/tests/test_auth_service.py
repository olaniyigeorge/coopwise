from fastapi import HTTPException
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from jose import jwt

from app.schemas.user import UserCreate
from app.services.auth_service import AuthService
from app.utils.crypto import verify_password
from app.core.config import config


@pytest.mark.asyncio
@pytest.mark.essential
async def test_register_user(test_db_session: AsyncSession):
    user_data = UserCreate(
        full_name="Test User",
        email="testuser1@example.com",
        password="securepass",
        phone_number="+2348000000001",
        username="testuser1",
    )

    user = await AuthService.register_user(user_data, test_db_session)
    assert user.email == user_data.email
    assert user.username == user_data.username
    assert verify_password("securepass", user.password)


@pytest.mark.asyncio
async def test_duplicate_email_registration(test_db_session: AsyncSession):
    user_data = UserCreate(
        full_name="Test User 2",
        email="testuser2@example.com",
        password="securepass",
        phone_number="+2348000000002",
        username="testuser2",
    )
    await AuthService.register_user(user_data, test_db_session)

    with pytest.raises(Exception) as exc:
        await AuthService.register_user(user_data, test_db_session)
    assert "already registered" in str(
        exc.value
    )  # DOing this because I don't have standard format for wrapping response yet


@pytest.mark.asyncio
@pytest.mark.essential
async def test_authenticate_user_success(test_db_session: AsyncSession):
    user_data = UserCreate(
        full_name="Auth Test",
        email="authuser@example.com",
        password="authpass",
        phone_number="+2348000000003",
        username="authuser",
    )
    await AuthService.register_user(user_data, test_db_session)
    user = await AuthService.authenticate_user(
        "authuser@example.com", "authpass", test_db_session
    )
    assert user is not None
    assert user.email == "authuser@example.com"


@pytest.mark.asyncio
async def test_token_generation_and_decoding():
    data = {"sub": "auth@example.com", "id": str("0000-00000-00000"), "role": "user"}
    token = await AuthService.create_access_token(data=data)
    decoded = await AuthService.decode_token(token)
    assert decoded["sub"] == "auth@example.com"
    assert "exp" in decoded


@pytest.mark.asyncio
async def test_password_reset_token(test_db_session: AsyncSession):
    user_data = UserCreate(
        full_name="Reset Test",
        email="reset@example.com",
        password="resetpass",
        phone_number="+2348000000004",
        username="resetuser",
    )
    user = await AuthService.register_user(user_data, test_db_session)

    token = await AuthService.create_password_reset_token(user)
    decoded = jwt.decode(token, config.APP_SECRET_KEY, algorithms=[config.ALGORITHM])
    assert decoded["sub"] == user.email
    assert decoded["type"] == "reset"


@pytest.mark.asyncio
async def test_confirm_reset_token_valid(test_db_session):
    # Register a user
    user_data = UserCreate(
        full_name="Confirm Token",
        email="confirmtoken@example.com",
        password="tokenpass",
        phone_number="+2348000000006",
        username="tokenuser",
    )
    user = await AuthService.register_user(user_data, test_db_session)

    # Generate reset token
    token = await AuthService.create_password_reset_token(user)

    # Confirm token
    payload = await AuthService.confirm_reset_token(token)

    assert payload["sub"] == user.email
    assert payload["type"] == "reset"


@pytest.mark.asyncio
async def test_confirm_reset_token_invalid_type():
    # Manually create a token with wrong type
    payload = {
        "sub": "fake@example.com",
        "type": "access",
        "exp": (datetime.now(timezone.utc) + timedelta(minutes=1)).timestamp(),
    }
    token = jwt.encode(payload, config.APP_SECRET_KEY, algorithm=config.ALGORITHM)

    with pytest.raises(HTTPException) as exc_info:
        await AuthService.confirm_reset_token(token)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Invalid token type"


@pytest.mark.asyncio
async def test_change_password_flow(test_db_session: AsyncSession):
    user_data = UserCreate(
        full_name="Change Me",
        email="changepass@example.com",
        password="oldpass",
        phone_number="+2348000000005",
        username="changeme",
    )
    user = await AuthService.register_user(user_data, test_db_session)

    token = await AuthService.create_password_reset_token(user)
    result = await AuthService.change_password(token, "newpass123", test_db_session)
    assert result["status"] == "success"

    # Ensure login works with new password
    auth_user = await AuthService.authenticate_user(
        "changepass@example.com", "newpass123", test_db_session
    )
    assert auth_user is not None
