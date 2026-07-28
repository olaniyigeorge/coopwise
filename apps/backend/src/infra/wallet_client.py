from config import AppConfig as config

from src.infra.payments.crossmint import CrossmintWalletClient


def get_crossmint_wallet_client() -> CrossmintWalletClient:
    return CrossmintWalletClient(
        server_api_key=config.CROSSMINT_SERVER_API_KEY,
        chain=config.CROSSMINT_CHAIN,
        server_signer_address=config.CROSSMINT_SERVER_SIGNER_ADDRESS,
        api_base_url=(
            "https://www.crossmint.com/api" if config.ENV == "production"
            else "https://staging.crossmint.com/api"
        ),
    )