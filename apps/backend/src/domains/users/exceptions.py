class UserDomainError(Exception):
    """Base class for all users-domain errors."""


class UserNotFoundError(UserDomainError):
    pass


class UserFetchError(UserDomainError):
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


class UserUpdateError(UserDomainError):
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)
