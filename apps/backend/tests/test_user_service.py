from uuid import uuid4

import pytest

from src.domains.users.exceptions import UserNotFoundError
from src.domains.users.service import UserService
from src.domains.users.schemas import UserUpdate

from .fakes_users import FakeUserRepository


@pytest.fixture
def user_repo():
    return FakeUserRepository()


@pytest.fixture
def user_service(user_repo):
    return UserService(user_repo=user_repo)


class TestGetUsers:
    async def test_returns_paginated_users(self, user_service, user_repo):
        for _ in range(5):
            user_repo.seed()
        page = await user_service.get_users(skip=0, limit=3)
        assert len(page) == 3


class TestGetUserById:
    async def test_returns_existing_user(self, user_service, user_repo):
        seeded = user_repo.seed()
        user = await user_service.get_user_by_id(seeded.id)
        assert user.id == seeded.id

    async def test_unknown_id_raises_not_found_not_500(self, user_service):
        # This is the bug fix: previously this path raised HTTPException(404)
        # inside a try/except Exception that recaught it and re-raised 500.
        with pytest.raises(UserNotFoundError):
            await user_service.get_user_by_id(uuid4())


class TestUpdateUser:
    async def test_updates_only_provided_fields(self, user_service, user_repo):
        seeded = user_repo.seed(full_name="Original Name")
        updated = await user_service.update_user(
            seeded.id, UserUpdate(full_name="New Name")
        )
        assert updated.full_name == "New Name"
        assert updated.username == seeded.username  # untouched field preserved

    async def test_unknown_id_raises_not_found(self, user_service):
        with pytest.raises(UserNotFoundError):
            await user_service.update_user(uuid4(), UserUpdate(full_name="X"))


class TestVerifyUser:
    async def test_false_when_nothing_verified(self, user_service, user_repo):
        seeded = user_repo.seed()
        assert await user_service.verify_user(seeded.id) is False

    async def test_true_only_when_all_four_conditions_met(self, user_service, user_repo):
        seeded = user_repo.seed(
            is_email_verified=True,
            is_phone_verified=True,
            is_video_verified=True,
            wallet_activated=True,
        )
        # This call alone proves the crash bug is fixed: previously
        # `user.is_video_verified` / `user.wallet_activated` didn't exist
        # on the model and this raised AttributeError.
        assert await user_service.verify_user(seeded.id) is True

    async def test_false_when_only_some_conditions_met(self, user_service, user_repo):
        seeded = user_repo.seed(is_email_verified=True, is_phone_verified=True)
        assert await user_service.verify_user(seeded.id) is False

    async def test_unknown_id_raises_not_found(self, user_service):
        with pytest.raises(UserNotFoundError):
            await user_service.verify_user(uuid4())


class TestKyc:
    async def test_marks_verified_when_all_three_inputs_true(self, user_service, user_repo):
        seeded = user_repo.seed()
        result = await user_service.kyc(
            seeded.id, video_verified=True, email_verified=True, wallet_activated=True
        )
        assert result["is_verified"] is True
        assert result["details"]["is_video_verified"] is True

    async def test_partial_kyc_does_not_mark_verified(self, user_service, user_repo):
        seeded = user_repo.seed()
        result = await user_service.kyc(seeded.id, video_verified=True)
        assert result["is_verified"] is False

    async def test_kyc_flags_are_sticky_not_overwritable_to_false(self, user_service, user_repo):
        """Once true, a flag should stay true even if a later kyc() call
        doesn't re-assert it (matches original `x or user.x` semantics)."""
        seeded = user_repo.seed()
        await user_service.kyc(seeded.id, email_verified=True)
        result = await user_service.kyc(seeded.id, video_verified=True)
        assert result["details"]["is_email_verified"] is True
        assert result["details"]["is_video_verified"] is True

    async def test_is_verified_cannot_be_set_directly_only_derived(self, user_service, user_repo):
        seeded = user_repo.seed()
        result = await user_service.kyc(seeded.id)
        assert "is_verified" in result
        assert result["is_verified"] is False

    async def test_unknown_id_raises_not_found(self, user_service):
        with pytest.raises(UserNotFoundError):
            await user_service.kyc(uuid4(), video_verified=True)
