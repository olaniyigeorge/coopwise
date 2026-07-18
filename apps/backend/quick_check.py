# quick_check.py
from config import AppConfig as config
from jose import jwt

claims = {"test": "hello"}
token = jwt.encode(claims, config.JWT_PRIVATE_KEY, algorithm="ES256", headers={"kid": config.JWT_KID})
print(jwt.decode(token, config.JWT_PUBLIC_KEY, algorithms=["ES256"]))