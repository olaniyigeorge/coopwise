"""
Money handling: integers in storage, Decimal at the edges, never float.

Amounts are persisted as whole numbers of the smallest unit ("minor units"):
  * fiat (NGN/GHS/KES): 2 decimal places -> kobo / pesewa / cent   (FIAT_DP)
  * stable coin (USDC-style): 6 decimal places -> micro-units       (STABLE_DP)

Integer columns make sums, comparisons and balance checks exact. Rounding
happens in exactly one place — `to_minor` — with one rule (half-up), at the
moment an amount enters the system (e.g. after applying an FX rate), not
scattered through arithmetic.
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Union

FIAT_DP = 2
STABLE_DP = 6

Amount = Union[Decimal, int, str, float]

# Mock rate: 1 stable-coin unit == 1600 local-currency units. Deliberately
# hardcoded for now (wallet FX is not wired to a live provider yet). It lives
# here, once, so every conversion — deposits, withdrawals, contribution
# balance checks and the balance shown to the user — uses the same number.
MOCK_LOCAL_TO_STABLE_RATE = Decimal(1) / Decimal(1600)


def _to_decimal(amount: Amount) -> Decimal:
    if isinstance(amount, Decimal):
        return amount
    # str() first so a float like 0.1 becomes Decimal("0.1"), not the
    # binary-noise expansion Decimal(0.1) would give.
    return Decimal(str(amount))


def to_minor(amount: Amount, dp: int) -> int:
    """Convert a major-unit amount to whole minor units, rounding half-up."""
    scaled = _to_decimal(amount) * (Decimal(10) ** dp)
    return int(scaled.to_integral_value(rounding=ROUND_HALF_UP))


def from_minor(minor: int, dp: int) -> Decimal:
    """Whole minor units -> Decimal with exactly `dp` places (never '0E-8')."""
    return (Decimal(int(minor or 0)) / (Decimal(10) ** dp)).quantize(
        Decimal(1).scaleb(-dp)
    )


def to_micro(amount: Amount) -> int:
    return to_minor(amount, STABLE_DP)


def from_micro(micro: int) -> Decimal:
    return from_minor(micro, STABLE_DP)


def to_kobo(amount: Amount) -> int:
    return to_minor(amount, FIAT_DP)


def from_kobo(kobo: int) -> Decimal:
    return from_minor(kobo, FIAT_DP)


def stable_to_local(stable: Decimal) -> Decimal:
    """Stable-coin amount -> local currency, rounded to 2 places for display."""
    return (Decimal(stable) / MOCK_LOCAL_TO_STABLE_RATE).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
