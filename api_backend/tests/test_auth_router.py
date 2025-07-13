import pytest
from httpx import AsyncClient

# Integration Tests (API Routes)

@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient):
    payload = {
        "full_name": "Test User",
        "email": "testuser@example.com",
        "password": "securepassword123",
        "phone_number": "+2348012345678",
        "role": "user",
        "target_savings_amount": 50000.0,
        "savings_purpose": "Build emergency fund",
        "income_range": "range_50k_100k",
        "saving_frequency": "monthly"
    }

    response = await async_client.post("/api/v1/auth/register", json=payload)
    data = response.json()

    assert response.status_code == 200
    assert "token" in data
    assert "user" in data
    assert data["user"]["email"] == payload["email"]


@pytest.mark.asyncio
async def test_login_user(async_client: AsyncClient):
    # Register user
    await async_client.post("/api/v1/auth/register", json={
        "full_name": "Test User",
        "email": "testuser@example.com",
        "password": "securepassword123",
        "phone_number": "+2348012345678",
        "target_savings_amount": 50000.0,
        "savings_purpose": "Build emergency fund",
        "income_range": "range_50k_100k",
        "saving_frequency": "monthly"
    })

    # Test new creds
    login_data = {
        "username": "testuser@example.com",
        "password": "securepassword123"
    }

    response = await async_client.post(
        "/api/v1/auth/login",
        data=login_data,  
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )

    data = response.json()

    assert response.status_code == 200
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == login_data["username"]
