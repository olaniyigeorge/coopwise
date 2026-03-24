"""
FX conversion service — NGN/KES/GHS → USDC.

Real implementation will use the Band Protocol oracle on Flow
or a reliable FX API (e.g. ExchangeRate-API, Open Exchange Rates).
"""
import logging
import httpx

logger = logging.getLogger(__name__)

# Fallback rates (updated manually until oracle is wired)
FALLBACK_RATES_TO_USD: dict[str, float] = {
    "NGN": 1580.0,   # 1 USD ≈ 1580 NGN
    "KES": 129.0,    # 1 USD ≈ 129 KES
    "GHS": 15.4,     # 1 USD ≈ 15.4 GHS
    "USD": 1.0,
}


class FXService:

    async def to_usdc(self, amount: float, currency: str) -> float:
        """
        Convert a local-currency amount to USDC (1 USDC ≈ 1 USD).

        Tries a live rate first, falls back to hardcoded rates.
        USDC has 6 decimal places — we round to 6dp.
        """
        rate = await self._get_rate(currency)
        usdc = round(amount / rate, 6)
        logger.info(
            f"[FXService] {amount} {currency} → {usdc} USDC (rate={rate})"
        )
        return usdc

    async def ngn_to_usdc(self, amount_ngn: float) -> float:
        return await self.to_usdc(amount_ngn, "NGN")

    async def _get_rate(self, currency: str) -> float:
        """
        Fetch live USD/{currency} rate from ExchangeRate-API (free tier).
        Falls back to hardcoded rate on any error.

        TODO: Replace with Band Protocol oracle on-chain read once
        the Flow integration is live.
        """
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                r = await client.get(
                    f"https://open.er-api.com/v6/latest/USD"
                )
                r.raise_for_status()
                rates = r.json().get("rates", {})
                if currency in rates:
                    return float(rates[currency])
        except Exception as e:
            logger.warning(
                f"[FXService] Live rate fetch failed for {currency}, "
                f"using fallback. Error: {e}"
            )
        return FALLBACK_RATES_TO_USD.get(currency, 1.0)


# Singleton
fx_service = FXService()