from pathlib import Path
from fastapi import APIRouter
from jwcrypto import jwk

router = APIRouter(prefix="", tags=["Public JWK"])

BACKEND_ROOT = Path(__file__).resolve().parents[3]  # src/domains/auth -> apps/backend

def _load_public_key() -> jwk.JWK:
    candidates = [
        BACKEND_ROOT / "public.pem",       # local dev (dev.sh cwd)
        Path("/etc/secrets/public.pem"),   # Render secret file mount
    ]
    for path in candidates:
        if path.exists():
            with open(path, "rb") as f:
                return jwk.JWK.from_pem(f.read())
    raise FileNotFoundError(
        f"public.pem not found in any of: {[str(p) for p in candidates]}"
    )

key = _load_public_key()
key.update(kid="coopwise-2026-07", use="sig", alg="ES256")

@router.get("/.well-known/jwks.json")
async def jwks():
    return {"keys": [key.export_public(as_dict=True)]}