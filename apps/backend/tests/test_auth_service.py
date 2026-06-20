from datetime import timedelta
from uuid import uuid4

import pytest

from src.domains.auth.exceptions import (
    EmailAlreadyRegisteredError,
    InvalidTokenError,
    InvalidTokenTypeError,
    PhoneNumberAlreadyRegisteredError,
    TokenExpiredError,
    UserNotFoundError,
    UsernameAlreadyRegisteredError,
)
from src.domains.auth.service import AuthService
from src.domains.users.models import UserRoles
from src.domains.users.schemas import UserCreate, iAuthWallet

from .fakes_auth import (
    FakeAuthNotifier,
    FakeClock,
    FakePasswordHasher,
    FakeTokenService,
    FakeUserRepository,
)

pytestmark = pytest.mark.unit


@pytest.fixture
def user_repo():
    return FakeUserRepository()


@pytest.fixture
def notifier():
    return FakeAuthNotifier()


@pytest.fixture
def clock():
    return FakeClock()


@pytest.fixture
def auth_service(user_repo, notifier, clock):
    return AuthService(
        user_repo=user_repo,
        password_hasher=FakePasswordHasher(),
        token_service=FakeTokenService(),
        clock=clock,
        notifier=notifier,
        client_domain="https://app.coopwise.example",
    )


def make_user_create(**overrides) -> UserCreate:
    defaults = dict(
        username="ada",
        email="ada@coopwise.example",
        password="supersecret",
        full_name="Ada Lovelace",
        phone_number="+2348012345678",
    )
    defaults.update(overrides)
    return UserCreate(**defaults)


# ----------------------------------------------------------------- register

class TestRegisterUser:
    async def test_creates_user_with_hashed_password(self, auth_service, user_repo):
        user = await auth_service.register_user(make_user_create())

        assert user.email == "ada@coopwise.example"
        assert user.password == "hashed::supersecret"
        assert user.role == UserRoles.user
        assert user.id in user_repo.users

    async def test_defaults_username_from_email_local_part_when_missing(self, auth_service):
        user = await auth_service.register_user(make_user_create(username=None))
        assert user.username == "ada"

    async def test_fires_registration_notification(self, auth_service, notifier):
        user = await auth_service.register_user(make_user_create())
        assert notifier.registered_calls == [user]

    async def test_duplicate_email_rejected(self, auth_service):
        await auth_service.register_user(make_user_create())
        with pytest.raises(EmailAlreadyRegisteredError):
            await auth_service.register_user(
                make_user_create(username="other", phone_number="+2348000000000")
            )

    async def test_duplicate_username_rejected(self, auth_service):
        await auth_service.register_user(make_user_create())
        with pytest.raises(UsernameAlreadyRegisteredError):
            await auth_service.register_user(
                make_user_create(email="other@coopwise.example", phone_number="+2348000000000")
            )

    async def test_duplicate_phone_number_rejected(self, auth_service):
        await auth_service.register_user(make_user_create())
        with pytest.raises(PhoneNumberAlreadyRegisteredError):
            await auth_service.register_user(
                make_user_create(email="other@coopwise.example", username="other")
            )

    async def test_duplicate_checks_short_circuit_before_notification(
        self, auth_service, notifier
    ):
        await auth_service.register_user(make_user_create())
        notifier.registered_calls.clear()
        with pytest.raises(EmailAlreadyRegisteredError):
            await auth_service.register_user(
                make_user_create(username="other", phone_number="+2348000000000")
            )
        assert notifier.registered_calls == []


# ------------------------------------------------------------- authenticate

class TestAuthenticateUser:
    async def test_correct_credentials_returns_user(self, auth_service):
        registered = await auth_service.register_user(make_user_create())
        user = await auth_service.authenticate_user("ada@coopwise.example", "supersecret")
        assert user.id == registered.id

    async def test_wrong_password_returns_none(self, auth_service):
        await auth_service.register_user(make_user_create())
        user = await auth_service.authenticate_user("ada@coopwise.example", "wrong")
        assert user is None

    async def test_unknown_email_returns_none(self, auth_service):
        user = await auth_service.authenticate_user("nobody@coopwise.example", "whatever")
        assert user is None


# -------------------------------------------------------------------- tokens

class TestAccessTokens:
    async def test_encodes_given_claims(self, auth_service):
        token = await auth_service.create_access_token({"sub": "ada@coopwise.example", "id": "1"})
        payload = await auth_service.decode_token(token)
        assert payload["sub"] == "ada@coopwise.example"
        assert payload["id"] == "1"
        assert "exp" in payload

    async def test_decode_invalid_token_raises(self, auth_service):
        with pytest.raises(InvalidTokenError):
            await auth_service.decode_token("not-a-real-token")

    async def test_respects_custom_expiry(self, auth_service, clock):
        token = await auth_service.create_access_token(
            {"sub": "ada@coopwise.example"}, expires_delta=timedelta(hours=2)
        )
        payload = await auth_service.decode_token(token)
        expected_exp = (clock.now() + timedelta(hours=2)).timestamp()
        assert payload["exp"] == expected_exp


# ------------------------------------------------------------- password reset

class TestPasswordReset:
    async def test_send_reset_link_for_unknown_email_raises(self, auth_service):
        with pytest.raises(UserNotFoundError):
            await auth_service.send_reset_password_link("ghost@coopwise.example")

    async def test_send_reset_link_for_known_email_succeeds(self, auth_service):
        await auth_service.register_user(make_user_create())
        result = await auth_service.send_reset_password_link("ada@coopwise.example")
        assert "message" in result

    async def test_confirm_reset_token_round_trips(self, auth_service):
        user = await auth_service.register_user(make_user_create())
        token = await auth_service.create_password_reset_token(user)
        payload = await auth_service.confirm_reset_token(token)
        assert payload["sub"] == user.email
        assert payload["type"] == "reset"

    async def test_confirm_reset_token_rejects_wrong_type(self, auth_service):
        # An access token (no type="reset") should not be accepted as a reset token.
        token = await auth_service.create_access_token({"sub": "ada@coopwise.example"})
        with pytest.raises(InvalidTokenTypeError):
            await auth_service.confirm_reset_token(token)

    async def test_confirm_reset_token_rejects_expired_token(self, auth_service, clock):
        user = await auth_service.register_user(make_user_create())
        token = await auth_service.create_password_reset_token(
            user, expires_delta=timedelta(minutes=15)
        )
        clock.advance(timedelta(minutes=16))
        with pytest.raises(TokenExpiredError):
            await auth_service.confirm_reset_token(token)

    async def test_change_password_updates_hash_and_allows_new_login(self, auth_service):
        user = await auth_service.register_user(make_user_create())
        token = await auth_service.create_password_reset_token(user)

        result = await auth_service.change_password(token, "newpassword123")
        assert result["status"] == "success"

        assert await auth_service.authenticate_user("ada@coopwise.example", "supersecret") is None
        relogged = await auth_service.authenticate_user("ada@coopwise.example", "newpassword123")
        assert relogged is not None

    async def test_change_password_with_expired_token_raises(self, auth_service, clock):
        user = await auth_service.register_user(make_user_create())
        token = await auth_service.create_password_reset_token(
            user, expires_delta=timedelta(minutes=15)
        )
        clock.advance(timedelta(minutes=20))
        with pytest.raises(TokenExpiredError):
            await auth_service.change_password(token, "newpassword123")


# -------------------------------------------------------------------- wallet

class TestFlowSync:
    async def test_creates_new_user_when_no_match_found(self, auth_service, user_repo):
        wallet_data = iAuthWallet(
            crossmint_user_id="cm_abc123",
            email="",
            flow_address="0xABCDEF1234567890",
        )
        result = await auth_service.flow_sync(wallet_data, current_user=None)

        assert result["user"]["crossmint_user_id"] == "cm_abc123"
        assert result["user"]["flow_address"] == "0xABCDEF1234567890"
        assert result["user"]["email"] == "cm_abc123@crossmint.local"
        assert len(user_repo.users) == 1

    async def test_finds_existing_user_by_crossmint_id(self, auth_service):
        first = await auth_service.flow_sync(
            iAuthWallet(crossmint_user_id="cm_abc123", email="", flow_address="0xAAA"),
            current_user=None,
        )
        second = await auth_service.flow_sync(
            iAuthWallet(crossmint_user_id="cm_abc123", email="", flow_address="0xAAA"),
            current_user=None,
        )
        assert first["user"]["id"] == second["user"]["id"]

    async def test_finds_existing_user_by_email_fallback(self, auth_service):
        registered = await auth_service.register_user(make_user_create())
        result = await auth_service.flow_sync(
            iAuthWallet(
                crossmint_user_id="cm_new",
                email="ada@coopwise.example",
                flow_address="0xBBB",
            ),
            current_user=None,
        )
        assert result["user"]["id"] == str(registered.id)
        assert result["user"]["crossmint_user_id"] == "cm_new"
        assert result["user"]["flow_address"] == "0xBBB"

    async def test_updates_flow_address_on_existing_linked_user(self, auth_service):
        first = await auth_service.flow_sync(
            iAuthWallet(crossmint_user_id="cm_abc123", email="", flow_address="0xAAA"),
            current_user=None,
        )
        second = await auth_service.flow_sync(
            iAuthWallet(crossmint_user_id="cm_abc123", email="", flow_address="0xCCC"),
            current_user=None,
        )
        assert first["user"]["id"] == second["user"]["id"]
        assert second["user"]["flow_address"] == "0xCCC"

    async def test_fires_wallet_linked_notification(self, auth_service, notifier):
        await auth_service.flow_sync(
            iAuthWallet(crossmint_user_id="cm_abc123", email="", flow_address="0xAAA"),
            current_user=None,
        )
        assert len(notifier.wallet_linked_calls) == 1
        linked_user, flow_address = notifier.wallet_linked_calls[0]
        assert flow_address == "0xAAA"

    async def test_returns_usable_access_token(self, auth_service):
        result = await auth_service.flow_sync(
            iAuthWallet(crossmint_user_id="cm_abc123", email="", flow_address="0xAAA"),
            current_user=None,
        )
        payload = await auth_service.decode_token(result["access_token"])
        assert payload["id"] == result["user"]["id"]
        assert payload["flow_address"] == "0xAAA"
