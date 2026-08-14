from datetime import timedelta

import pytest

from src.domains.auth.exceptions import (
    FirebaseVerificationError,
    FullNameRequiredError,
    InvalidCredentialsError,
    InvalidTokenError,
    InvalidTokenTypeError,
    OtpInvalidOrExpiredError,
    TokenExpiredError,
)
from src.domains.auth.ports import FirebaseIdentity, OtpChannel
from src.domains.auth.schemas import (
    FirebaseSignIn,
    PasswordSignIn,
    RequestOtp,
    VerifyOtp,
)
from src.domains.auth.service import AuthService

from .fakes_auth import (
    FakeAuthNotifier,
    FakeClock,
    FakeFirebaseVerifier,
    FakeOtpSender,
    FakeOtpStore,
    FakePasswordHasher,
    FakeTokenService,
    FakeUserRepository,
)

pytestmark = pytest.mark.unit


@pytest.fixture
def user_repo():
    return FakeUserRepository()


@pytest.fixture
def otp_store():
    return FakeOtpStore()


@pytest.fixture
def otp_senders():
    return {
        OtpChannel.phone: FakeOtpSender(OtpChannel.phone),
        OtpChannel.email: FakeOtpSender(OtpChannel.email),
    }


@pytest.fixture
def firebase_verifier():
    return FakeFirebaseVerifier()


@pytest.fixture
def notifier():
    return FakeAuthNotifier()


@pytest.fixture
def clock():
    return FakeClock()


@pytest.fixture
def auth_service(user_repo, otp_store, otp_senders, firebase_verifier, notifier, clock):
    return AuthService(
        user_repo=user_repo,
        otp_store=otp_store,
        otp_senders=otp_senders,
        firebase_verifier=firebase_verifier,
        access_token_service=FakeTokenService(),
        refresh_token_service=FakeTokenService(),
        password_hasher=FakePasswordHasher(),
        clock=clock,
        notifier=notifier,
    )


# ------------------------------------------------------------------- OTP request


class TestRequestOtp:
    async def test_sends_code_via_matching_channel_sender(
        self, auth_service, otp_senders
    ):
        await auth_service.request_otp(
            RequestOtp(channel=OtpChannel.email, identifier="ada@coopwise.example")
        )
        sender = otp_senders[OtpChannel.email]
        assert len(sender.sent) == 1
        identifier, code = sender.sent[0]
        assert identifier == "ada@coopwise.example"
        assert code  # non-empty, whatever the store generated


# -------------------------------------------------------------------- OTP verify


class TestVerifyOtp:
    async def test_new_user_registers_and_fires_notification(
        self, auth_service, otp_store, notifier, user_repo
    ):
        code = await otp_store.issue_code(OtpChannel.email, "ada@coopwise.example")
        result = await auth_service.verify_otp(
            VerifyOtp(
                channel="email",
                identifier="ada@coopwise.example",
                code=code,
                full_name="Ada Lovelace",
            )
        )
        assert result.is_new_user is True
        assert result.user.email == "ada@coopwise.example"
        assert user_repo.users[result.user.id].is_email_verified is True
        assert len(notifier.registered_calls) == 1

    async def test_new_user_without_full_name_raises(self, auth_service, otp_store):
        code = await otp_store.issue_code(OtpChannel.email, "ada@coopwise.example")
        with pytest.raises(FullNameRequiredError):
            await auth_service.verify_otp(
                VerifyOtp(channel="email", identifier="ada@coopwise.example", code=code)
            )

    async def test_wrong_code_raises(self, auth_service, otp_store):
        await otp_store.issue_code(OtpChannel.email, "ada@coopwise.example")
        with pytest.raises(OtpInvalidOrExpiredError):
            await auth_service.verify_otp(
                VerifyOtp(
                    channel="email",
                    identifier="ada@coopwise.example",
                    code="000000",
                    full_name="Ada Lovelace",
                )
            )

    async def test_existing_user_marks_verified_and_is_not_new(
        self, auth_service, otp_store, user_repo
    ):
        existing = user_repo.seed(email="ada@coopwise.example", is_email_verified=False)
        code = await otp_store.issue_code(OtpChannel.email, "ada@coopwise.example")
        result = await auth_service.verify_otp(
            VerifyOtp(channel="email", identifier="ada@coopwise.example", code=code)
        )
        assert result.is_new_user is False
        assert result.user.id == existing.id
        assert user_repo.users[existing.id].is_email_verified is True


# --------------------------------------------------------------- password sign-in


class TestPasswordSignIn:
    async def test_correct_password_succeeds(self, auth_service, user_repo):
        hashed = FakePasswordHasher().hash("supersecret")
        user_repo.seed(email="ada@coopwise.example", password=hashed)
        result = await auth_service.sign_in_with_password(
            PasswordSignIn(identifier="ada@coopwise.example", password="supersecret")
        )
        assert result.user.email == "ada@coopwise.example"

    async def test_wrong_password_raises(self, auth_service, user_repo):
        hashed = FakePasswordHasher().hash("supersecret")
        user_repo.seed(email="ada@coopwise.example", password=hashed)
        with pytest.raises(InvalidCredentialsError):
            await auth_service.sign_in_with_password(
                PasswordSignIn(identifier="ada@coopwise.example", password="wrong")
            )

    async def test_user_with_no_password_set_raises(self, auth_service, user_repo):
        user_repo.seed(email="ada@coopwise.example", password=None)
        with pytest.raises(InvalidCredentialsError):
            await auth_service.sign_in_with_password(
                PasswordSignIn(identifier="ada@coopwise.example", password="whatever")
            )

    async def test_unknown_identifier_raises(self, auth_service):
        with pytest.raises(InvalidCredentialsError):
            await auth_service.sign_in_with_password(
                PasswordSignIn(identifier="ghost@coopwise.example", password="x")
            )


# ----------------------------------------------------------------- firebase sign-in


class TestFirebaseSignIn:
    async def test_new_user_provisioned_from_identity(
        self, auth_service, firebase_verifier
    ):
        firebase_verifier.register(
            "tok-1",
            FirebaseIdentity(
                firebase_uid="fb-1",
                email="ada@coopwise.example",
                email_verified=True,
                full_name="Ada Lovelace",
            ),
        )
        result = await auth_service.sign_in_with_firebase(
            FirebaseSignIn(firebase_id_token="tok-1")
        )
        assert result.is_new_user is True
        assert result.user.email == "ada@coopwise.example"

    async def test_existing_user_found_by_email_fallback_links_uid(
        self, auth_service, firebase_verifier, user_repo
    ):
        existing = user_repo.seed(
            email="ada@coopwise.example", firebase_uid=None, is_email_verified=False
        )
        firebase_verifier.register(
            "tok-1",
            FirebaseIdentity(
                firebase_uid="fb-1",
                email="ada@coopwise.example",
                email_verified=True,
            ),
        )
        result = await auth_service.sign_in_with_firebase(
            FirebaseSignIn(firebase_id_token="tok-1")
        )
        assert result.is_new_user is False
        assert result.user.id == existing.id
        assert user_repo.users[existing.id].firebase_uid == "fb-1"
        assert user_repo.users[existing.id].is_email_verified is True

    async def test_invalid_token_raises_verification_error(self, auth_service):
        with pytest.raises(FirebaseVerificationError):
            await auth_service.sign_in_with_firebase(
                FirebaseSignIn(firebase_id_token="not-a-real-token")
            )


# ------------------------------------------------------------------- refresh session


class TestRefreshSession:
    async def test_round_trips_to_new_session(self, auth_service, otp_store):
        code = await otp_store.issue_code(OtpChannel.email, "ada@coopwise.example")
        first = await auth_service.verify_otp(
            VerifyOtp(
                channel="email",
                identifier="ada@coopwise.example",
                code=code,
                full_name="Ada Lovelace",
            )
        )
        refreshed = await auth_service.refresh_platform_session(first.refresh_token)
        assert refreshed.user.id == first.user.id

    async def test_wrong_token_type_rejected(self, auth_service, otp_store):
        # Simulate a token that decodes successfully via the refresh-token
        # service but was never minted as a refresh token (e.g. type
        # claim missing/wrong) — the defensive check in
        # refresh_platform_session, not the "different signing key
        # entirely" case (that fails at decode() with InvalidTokenError,
        # not InvalidTokenTypeError).
        bogus_token = auth_service._refresh_tokens.encode(
            {"id": "some-id", "type": "not-a-refresh-token"}, timedelta(minutes=5)
        )
        with pytest.raises(InvalidTokenTypeError):
            await auth_service.refresh_platform_session(bogus_token)

    async def test_access_token_rejected_by_refresh_decode(
        self, auth_service, otp_store
    ):
        # An access token was signed by a different TokenServicePort
        # entirely, so it should fail at decode(), not at the type check.
        code = await otp_store.issue_code(OtpChannel.email, "ada@coopwise.example")
        session = await auth_service.verify_otp(
            VerifyOtp(
                channel="email",
                identifier="ada@coopwise.example",
                code=code,
                full_name="Ada Lovelace",
            )
        )
        with pytest.raises(InvalidTokenError):
            await auth_service.refresh_platform_session(session.access_token)

    async def test_expired_refresh_token_raises(self, auth_service, otp_store, clock):
        code = await otp_store.issue_code(OtpChannel.email, "ada@coopwise.example")
        session = await auth_service.verify_otp(
            VerifyOtp(
                channel="email",
                identifier="ada@coopwise.example",
                code=code,
                full_name="Ada Lovelace",
            )
        )
        clock.advance(timedelta(days=31))
        with pytest.raises(TokenExpiredError):
            await auth_service.refresh_platform_session(session.refresh_token)


# ---------------------------------------------------------- wallet provisioning hook


class TestWalletProvisioningCallback:
    async def test_fires_on_successful_login_without_blocking(
        self, user_repo, otp_store, otp_senders, firebase_verifier, notifier, clock
    ):
        calls: list[tuple] = []
        service = AuthService(
            user_repo=user_repo,
            otp_store=otp_store,
            otp_senders=otp_senders,
            firebase_verifier=firebase_verifier,
            access_token_service=FakeTokenService(),
            refresh_token_service=FakeTokenService(),
            password_hasher=FakePasswordHasher(),
            clock=clock,
            notifier=notifier,
            on_user_authenticated=lambda user, token: calls.append((user.id, token)),
        )
        code = await otp_store.issue_code(OtpChannel.email, "ada@coopwise.example")
        result = await service.verify_otp(
            VerifyOtp(
                channel="email",
                identifier="ada@coopwise.example",
                code=code,
                full_name="Ada Lovelace",
            )
        )
        assert len(calls) == 1
        assert calls[0] == (result.user.id, result.access_token)

    async def test_callback_failure_does_not_fail_login(
        self, user_repo, otp_store, otp_senders, firebase_verifier, notifier, clock
    ):
        def boom(user, token):
            raise RuntimeError("crossmint is down")

        service = AuthService(
            user_repo=user_repo,
            otp_store=otp_store,
            otp_senders=otp_senders,
            firebase_verifier=firebase_verifier,
            access_token_service=FakeTokenService(),
            refresh_token_service=FakeTokenService(),
            password_hasher=FakePasswordHasher(),
            clock=clock,
            notifier=notifier,
            on_user_authenticated=boom,
        )
        code = await otp_store.issue_code(OtpChannel.email, "ada@coopwise.example")
        # Should not raise, despite the callback blowing up.
        result = await service.verify_otp(
            VerifyOtp(
                channel="email",
                identifier="ada@coopwise.example",
                code=code,
                full_name="Ada Lovelace",
            )
        )
        assert result.is_new_user is True
