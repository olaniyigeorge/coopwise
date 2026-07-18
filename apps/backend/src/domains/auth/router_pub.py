
from fastapi import APIRouter
from jwcrypto import jwk

router = APIRouter(prefix="", tags=["Public JWK"])



with open("public.pem", "rb") as f:
    key = jwk.JWK.from_pem(f.read())
key.update(kid="coopwise-2026-07", use="sig", alg="ES256")

@router.get("/.well-known/jwks.json")
async def jwks():
    return {"keys": [key.export_public(as_dict=True)]}
