src/domains/auth/
  ports.py              # Protocols: CrossmintVerifierPort, UserRepository, TokenServicePort, ClockPort, AuthNotifierPort
  schemas.py            # CrossmintSessionExchange, AuthenticatedUser, TokenData, SessionResponse
  exceptions.py         # trimmed: drop password/registration-specific, add Crossmint-verification ones
  service.py            # AuthService — single exchange_crossmint_session() method
  dependencies.py        # get_auth_service wiring
  infra/
    crossmint_verifier.py        # NEW — JWKS verification + getUser REST call
    sqlalchemy_user_repository.py # trimmed (drop phone/username uniqueness — not needed for provisioning)
    jose_token_service.py         # unchanged, still used for OUR platform JWT
    system_adapters.py            # drop PasslibPasswordHasher, keep SystemClock
    notifier_adapter.py           # unchanged
  router.py             # POST /api/v1/auth/session only
src/api/middlewares/
  dependencies.py        # get_current_user etc. fixed to call decode via JoseTokenService directly, not AuthService.decode_token as static