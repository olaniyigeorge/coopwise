from httpx import AsyncClient
import pytest


def test_sanity():
    assert "sane" == "sane"


@pytest.mark.asyncio
async def test_read_root(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
