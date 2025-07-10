# # tests/test_auth.py

# import pytest

# @pytest.mark.asyncio
# @pytest.mark.essential
# async def test_register_user(client):
#     response = await client.post("/api/v1/auth/register", json={
#         "email": "test@coopwise.com",
#         "password": "secure123",
#         "full_name": "Test User"
#     })
#     assert response.status_code == 201
#     data = response.json()
#     assert "id" in data
#     assert data["email"] == "test@coopwise.com"
