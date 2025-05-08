from datetime import datetime, timedelta
from io import BytesIO
from typing import Any
import bcrypt

# --- Password Hashing & Verification Functions ---
def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies if a plaintext password matches the hashed password.

    :param plaintext_password: The plaintext password to verify.
    :param hashed_password: The hashed password to compare with.
    :return: True if the password matches, False otherwise.
    """
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
