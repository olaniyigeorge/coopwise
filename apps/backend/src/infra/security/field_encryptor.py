from cryptography.fernet import Fernet


class FieldEncryptor:
    """Reversible encryption for sensitive KYC fields (doc numbers, account numbers).
    NOT for passwords — bcrypt/BcryptPasswordHasher stays for those."""

    def __init__(self, key: str):
        self._fernet = Fernet(key.encode("utf-8") if isinstance(key, str) else key)

    def encrypt(self, value: str) -> str:
        return self._fernet.encrypt(value.encode("utf-8")).decode("utf-8")

    def decrypt(self, token: str) -> str:
        return self._fernet.decrypt(token.encode("utf-8")).decode("utf-8")