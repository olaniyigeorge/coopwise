import pytest


def test_simple():
    """Simple test to verify pytest is working"""
    assert True


def test_basic_math():
    """Basic math test"""
    assert 2 + 2 == 4
    assert 5 * 5 == 25


@pytest.mark.asyncio
async def test_async_simple():
    """Simple async test"""
    result = await async_function()
    assert result == "async_works"


async def async_function():
    """Simple async function for testing"""
    return "async_works"
