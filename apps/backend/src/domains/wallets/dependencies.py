


from src.infra.wallet_client import get_crossmint_wallet_client
from src.domains.wallets.service import WalletService


def get_wallet_service() -> WalletService:
    return WalletService(
        wallet_query=get_crossmint_wallet_client(),
    )