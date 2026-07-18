# generate_keys.py
import subprocess

subprocess.run(["openssl", "ecparam", "-genkey", "-name", "prime256v1", "-noout", "-out", "private.pem"], check=True)
subprocess.run(["openssl", "ec", "-in", "private.pem", "-pubout", "-out", "public.pem"], check=True)

import base64

with open("private.pem", "rb") as f:
    priv_b64 = base64.b64encode(f.read()).decode()
with open("public.pem", "rb") as f:
    pub_b64 = base64.b64encode(f.read()).decode()

print(f"JWT_PRIVATE_KEY={priv_b64}")
print(f"JWT_PUBLIC_KEY={pub_b64}")
print("JWT_KID=coopwise-2026-07")