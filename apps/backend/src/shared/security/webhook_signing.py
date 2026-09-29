import hmac
import hashlib


def verify_hmac_signature(
    raw_body: bytes, signature_header: str | None, secret: str
) -> bool:
    if not signature_header:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    # some providers prefix with "sha256=" — strip it if present
    provided = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, provided)


PAYSTACK_WHITELIST = ["52.31.139.75", "52.49.173.169", "52.214.14.220"]


def is_paystack_ip(x_forwarded_for: str | None) -> bool:
    """
    True if any hop in an X-Forwarded-For chain ("client, proxy1, proxy2") is
    a Paystack IP. The HMAC signature is the actual authentication; this is
    defence in depth and must tolerate proxy chains (e.g. behind Render).
    """
    if not x_forwarded_for:
        return False
    return any(hop.strip() in PAYSTACK_WHITELIST for hop in x_forwarded_for.split(","))


def verify_paystack_signature(
    raw_body: bytes, signature_header: str | None, secret: str
) -> bool:
    """Paystack signs the raw body with HMAC-SHA512 using the secret key."""
    if not signature_header:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature_header)
