# import pytest
# from fastapi import HTTPException
# from sqlalchemy.ext.asyncio import AsyncSession
# from uuid import uuid4
# from unittest.mock import patch

# from app.schemas.user import UserCreate, UserUpdate
# from app.services.user_service import UserService
# from app.utils.crypto import verify_password, get_password_hash
# from db.models.user import User


# class TestUserService:
#     """Comprehensive test suite for UserService"""

#     @pytest.mark.asyncio
#     async def test_register_user_success(self, async_session: AsyncSession):
#         """Test successful user registration"""
#         user_data = UserCreate(
#             full_name="John Doe",
#             email="john.doe@example.com",
#             password="securepass123",
#             phone_number="+2348000000001",
#             username="johndoe",
#         )

#         user = await UserService.register_user(user_data, async_session)

#         assert user.email == user_data.email
#         assert user.username == user_data.username
#         assert verify_password("securepass123", user.password)
#         assert user.id is not None
#         assert not user.is_verified  # Should be False by default

#     @pytest.mark.asyncio
#     async def test_register_user_duplicate_email(self, async_session: AsyncSession):
#         """Test registration fails with duplicate email"""
#         user_data = UserCreate(
#             full_name="Jane Doe",
#             email="duplicate@example.com",
#             password="securepass123",
#             phone_number="+2348000000002",
#             username="janedoe",
#         )

#         # Register first user
#         await UserService.register_user(user_data, async_session)

#         # Try to register with same email
#         duplicate_data = UserCreate(
#             full_name="Jane Smith",
#             email="duplicate@example.com",  # Same email
#             password="differentpass",
#             phone_number="+2348000000003",
#             username="janesmith",
#         )

#         with pytest.raises(HTTPException) as exc_info:
#             await UserService.register_user(duplicate_data, async_session)

#         assert exc_info.value.status_code == 400
#         assert "Email already registered" in str(exc_info.value.detail)

#     @pytest.mark.asyncio
#     async def test_get_users_empty_list(self, async_session: AsyncSession):
#         """Test getting users when database is empty"""
#         users = await UserService.get_users(async_session)
#         assert users == []

#     @pytest.mark.asyncio
#     async def test_get_users_with_pagination(self, async_session: AsyncSession):
#         """Test getting users with pagination"""
#         # Create multiple users
#         users_data = [
#             UserCreate(
#                 full_name=f"User {i}",
#                 email=f"user{i}@example.com",
#                 password="password123",
#                 phone_number=f"+234800000000{i}",
#                 username=f"user{i}",
#             )
#             for i in range(1, 6)  # Create 5 users
#         ]

#         for user_data in users_data:
#             await UserService.register_user(user_data, async_session)

#         # Test pagination
#         first_page = await UserService.get_users(async_session, skip=0, limit=3)
#         second_page = await UserService.get_users(async_session, skip=3, limit=3)

#         assert len(first_page) == 3
#         assert len(second_page) == 2

#         # Ensure different users returned
#         first_page_emails = {user.email for user in first_page}
#         second_page_emails = {user.email for user in second_page}
#         assert first_page_emails.isdisjoint(second_page_emails)

#     @pytest.mark.asyncio
#     async def test_get_user_by_id_success(self, async_session: AsyncSession):
#         """Test successfully getting user by ID"""
#         user_data = UserCreate(
#             full_name="Find Me",
#             email="findme@example.com",
#             password="findpass",
#             phone_number="+2348000000010",
#             username="findme",
#         )

#         created_user = await UserService.register_user(user_data, async_session)
#         found_user = await UserService.get_user_by_id(async_session, created_user.id)

#         assert found_user.id == created_user.id
#         assert found_user.email == created_user.email
#         assert found_user.username == created_user.username

#     @pytest.mark.asyncio
#     async def test_get_user_by_id_not_found(self, async_session: AsyncSession):
#         """Test getting user by non-existent ID"""
#         non_existent_id = uuid4()

#         with pytest.raises(HTTPException) as exc_info:
#             await UserService.get_user_by_id(async_session, non_existent_id)

#         assert exc_info.value.status_code == 404
#         assert "User not found" in str(exc_info.value.detail)

#     @pytest.mark.asyncio
#     async def test_update_user_success(self, async_session: AsyncSession):
#         """Test successful user update"""
#         # Create user first
#         user_data = UserCreate(
#             full_name="Update Me",
#             email="updateme@example.com",
#             password="updatepass",
#             phone_number="+2348000000011",
#             username="updateme",
#         )

#         created_user = await UserService.register_user(user_data, async_session)

#         # Update user
#         update_data = UserUpdate(
#             full_name="Updated Name",
#             phone_number="+2348000000012"
#         )

#         updated_user = await UserService.update_user(
#             async_session, str(created_user.id), update_data
#         )

#         assert updated_user.full_name == "Updated Name"
#         assert updated_user.phone_number == "+2348000000012"
#         assert updated_user.email == user_data.email  # Should remain unchanged
#         assert updated_user.username == user_data.username  # Should remain unchanged

#     @pytest.mark.asyncio
#     async def test_update_user_not_found(self, async_session: AsyncSession):
#         """Test updating non-existent user"""
#         non_existent_id = str(uuid4())
#         update_data = UserUpdate(full_name="Won't Work")

#         with pytest.raises(HTTPException) as exc_info:
#             await UserService.update_user(async_session, non_existent_id, update_data)

#         assert exc_info.value.status_code == 404
#         assert "User not found" in str(exc_info.value.detail)

#     @pytest.mark.asyncio
#     async def test_authenticate_user_success(self, async_session: AsyncSession):
#         """Test successful user authentication"""
#         user_data = UserCreate(
#             full_name="Auth User",
#             email="authuser@example.com",
#             password="authpass123",
#             phone_number="+2348000000013",
#             username="authuser",
#         )

#         await UserService.register_user(user_data, async_session)

#         authenticated_user = await UserService.authenticate_user(
#             "authuser@example.com", "authpass123", async_session
#         )

#         assert authenticated_user is not None
#         assert authenticated_user.email == "authuser@example.com"
#         assert authenticated_user.username == "authuser"

#     @pytest.mark.asyncio
#     async def test_authenticate_user_wrong_password(self, async_session: AsyncSession):
#         """Test authentication with wrong password"""
#         user_data = UserCreate(
#             full_name="Wrong Pass User",
#             email="wrongpass@example.com",
#             password="correctpass",
#             phone_number="+2348000000014",
#             username="wrongpass",
#         )

#         await UserService.register_user(user_data, async_session)

#         authenticated_user = await UserService.authenticate_user(
#             "wrongpass@example.com", "wrongpassword", async_session
#         )

#         assert authenticated_user is None

#     @pytest.mark.asyncio
#     async def test_authenticate_user_nonexistent_email(self, async_session: AsyncSession):
#         """Test authentication with non-existent email"""
#         authenticated_user = await UserService.authenticate_user(
#             "nonexistent@example.com", "anypassword", async_session
#         )

#         assert authenticated_user is None

#     @pytest.mark.asyncio
#     async def test_verify_user_all_verified(self, async_session: AsyncSession):
#         """Test user verification when all criteria are met"""
#         # Create and register user
#         user_data = UserCreate(
#             full_name="Verify User",
#             email="verify@example.com",
#             password="verifypass",
#             phone_number="+2348000000015",
#             username="verifyuser",
#         )

#         user = await UserService.register_user(user_data, async_session)

#         # Set all verification flags to True
#         await async_session.execute(
#             f"UPDATE users SET is_email_verified=1, is_video_verified=1, "
#             f"is_phone_verified=1, wallet_activated=1 WHERE id='{user.id}'"
#         )
#         await async_session.commit()

#         is_verified = await UserService.verify_user(str(user.id), async_session)
#         assert is_verified is True

#     @pytest.mark.asyncio
#     async def test_verify_user_partial_verification(self, async_session: AsyncSession):
#         """Test user verification when only some criteria are met"""
#         user_data = UserCreate(
#             full_name="Partial Verify",
#             email="partial@example.com",
#             password="partialpass",
#             phone_number="+2348000000016",
#             username="partial",
#         )

#         user = await UserService.register_user(user_data, async_session)

#         # Set only some verification flags
#         await async_session.execute(
#             f"UPDATE users SET is_email_verified=1, is_video_verified=0, "
#             f"is_phone_verified=1, wallet_activated=0 WHERE id='{user.id}'"
#         )
#         await async_session.commit()

#         is_verified = await UserService.verify_user(str(user.id), async_session)
#         assert is_verified is False

#     @pytest.mark.asyncio
#     async def test_verify_user_not_found(self, async_session: AsyncSession):
#         """Test verification check for non-existent user"""
#         non_existent_id = str(uuid4())

#         with pytest.raises(HTTPException) as exc_info:
#             await UserService.verify_user(non_existent_id, async_session)

#         assert exc_info.value.status_code == 404
#         assert "User not found" in str(exc_info.value.detail)

#     @pytest.mark.asyncio
#     async def test_kyc_update_all_fields(self, async_session: AsyncSession):
#         """Test KYC update with all verification fields"""
#         user_data = UserCreate(
#             full_name="KYC User",
#             email="kyc@example.com",
#             password="kycpass",
#             phone_number="+2348000000017",
#             username="kycuser",
#         )

#         user = await UserService.register_user(user_data, async_session)

#         result = await UserService.kyc(
#             str(user.id),
#             async_session,
#             video_verified=True,
#             email_verified=True,
#             wallet_activated=True,
#         )

#         assert result["status"] == "success"
#         assert result["is_verified"] is True
#         assert result["details"]["is_email_verified"] is True
#         assert result["details"]["is_video_verified"] is True
#         assert result["details"]["wallet_activated"] is True

#     @pytest.mark.asyncio
#     async def test_kyc_update_partial_fields(self, async_session: AsyncSession):
#         """Test KYC update with only some verification fields"""
#         user_data = UserCreate(
#             full_name="Partial KYC",
#             email="partialkyc@example.com",
#             password="partialkycpass",
#             phone_number="+2348000000018",
#             username="partialkyc",
#         )

#         user = await UserService.register_user(user_data, async_session)

#         # First update - only email verified
#         result1 = await UserService.kyc(
#             str(user.id),
#             async_session,
#             email_verified=True,
#         )

#         assert result1["is_verified"] is False
#         assert result1["details"]["is_email_verified"] is True
#         assert result1["details"]["is_video_verified"] is False
#         assert result1["details"]["wallet_activated"] is False

#         # Second update - add video verification
#         result2 = await UserService.kyc(
#             str(user.id),
#             async_session,
#             video_verified=True,
#         )

#         assert result2["is_verified"] is False  # Still missing wallet activation
#         assert result2["details"]["is_email_verified"] is True  # Should persist
#         assert result2["details"]["is_video_verified"] is True
#         assert result2["details"]["wallet_activated"] is False

#     @pytest.mark.asyncio
#     async def test_kyc_idempotent_updates(self, async_session: AsyncSession):
#         """Test that KYC updates are idempotent (can be called multiple times)"""
#         user_data = UserCreate(
#             full_name="Idempotent User",
#             email="idempotent@example.com",
#             password="idempotentpass",
#             phone_number="+2348000000019",
#             username="idempotent",
#         )

#         user = await UserService.register_user(user_data, async_session)

#         # Set email verified
#         await UserService.kyc(str(user.id), async_session, email_verified=True)

#         # Call again with same field - should remain True
#         result = await UserService.kyc(str(user.id), async_session, email_verified=False)

#         # Should still be True because of the `or` logic in the service
#         assert result["details"]["is_email_verified"] is True

#     @pytest.mark.asyncio
#     async def test_kyc_not_found_user(self, async_session: AsyncSession):
#         """Test KYC update for non-existent user"""
#         non_existent_id = str(uuid4())

#         with pytest.raises(HTTPException) as exc_info:
#             await UserService.kyc(
#                 non_existent_id,
#                 async_session,
#                 email_verified=True,
#             )

#         assert exc_info.value.status_code == 404
#         assert "User not found" in str(exc_info.value.detail)

#     @pytest.mark.asyncio
#     async def test_complete_user_lifecycle(self, async_session: AsyncSession):
#         """Test complete user lifecycle from registration to full verification"""
#         # 1. Register user
#         user_data = UserCreate(
#             full_name="Lifecycle User",
#             email="lifecycle@example.com",
#             password="lifecyclepass",
#             phone_number="+2348000000020",
#             username="lifecycle",
#         )

#         user = await UserService.register_user(user_data, async_session)
#         assert not user.is_verified

#         # 2. Authenticate user
#         auth_user = await UserService.authenticate_user(
#             "lifecycle@example.com", "lifecyclepass", async_session
#         )
#         assert auth_user is not None

#         # 3. Update user details
#         update_data = UserUpdate(full_name="Updated Lifecycle User")
#         updated_user = await UserService.update_user(
#             async_session, str(user.id), update_data
#         )
#         assert updated_user.full_name == "Updated Lifecycle User"

#         # 4. Verify user is not fully verified initially
#         is_verified = await UserService.verify_user(str(user.id), async_session)
#         assert is_verified is False

#         # 5. Complete KYC process step by step
#         await UserService.kyc(str(user.id), async_session, email_verified=True)
#         await UserService.kyc(str(user.id), async_session, video_verified=True)
#         final_result = await UserService.kyc(str(user.id), async_session, wallet_activated=True)

#         # 6. Verify user is now fully verified
#         assert final_result["is_verified"] is True
#         final_verification = await UserService.verify_user(str(user.id), async_session)
#         assert final_verification is True

#     @pytest.mark.asyncio
#     async def test_service_error_handling(self, async_session: AsyncSession):
#         """Test service handles database errors gracefully"""
#         # Test with database connection issues
#         with patch.object(async_session, 'execute', side_effect=Exception("Database error")):
#             with pytest.raises(HTTPException) as exc_info:
#                 await UserService.get_users(async_session)

#             assert exc_info.value.status_code == 500
#             assert "Could not fetch users" in str(exc_info.value.detail)
