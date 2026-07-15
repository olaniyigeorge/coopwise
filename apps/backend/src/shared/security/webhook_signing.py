import hmac
import hashlib

def verify_hmac_signature(raw_body: bytes, signature_header: str | None, secret: str) -> bool:
    if not signature_header:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    # some providers prefix with "sha256=" — strip it if present
    provided = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, provided)