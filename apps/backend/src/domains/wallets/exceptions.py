

class CrossmintApiError(Exception):
    """Base for any non-2xx response from Crossmint's REST API."""


class WalletNotFoundError(CrossmintApiError):
    pass


class WalletTransferError(CrossmintApiError):
    pass


class WalletBalanceError(CrossmintApiError):
    pass