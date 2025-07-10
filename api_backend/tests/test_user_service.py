# # tests/test_user_service.py

# import pytest
# from app.services.user_service import create_user
# from app.schemas.user import UserCreate

# @pytest.mark.asyncio
# async def test_create_user_logic(test_db):
#     user_in = UserCreate(email="new@user.com", password="12345678")
#     user = await create_user(user_in, db=test_db)
#     assert user.email == "new@user.com"
