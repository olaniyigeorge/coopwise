from config import AppConfig as config

from apps.backend.src.domains.auth.infra.crossmint_wallet_client import CrossmintWalletClient


def get_crossmint_wallet_client() -> CrossmintWalletClient:
    return CrossmintWalletClient(
        server_api_key=config.CROSSMINT_SERVER_API_KEY,
        chain=config.CROSSMINT_CHAIN,
        api_base_url=(
            "https://www.crossmint.com/api" if config.ENV == "production"
            else "https://staging.crossmint.com/api"
        ),
    )