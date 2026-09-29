from decimal import Decimal

from src.shared.money import (
    from_kobo,
    from_micro,
    to_kobo,
    to_micro,
    to_minor,
)


def test_floats_never_leak_binary_noise():
    # 0.1 + 0.2 != 0.3 in float; via str -> Decimal -> minor it is exact.
    assert to_kobo(0.1) + to_kobo(0.2) == to_kobo(0.3) == 30


def test_round_trip_is_exact():
    assert from_kobo(to_kobo(Decimal("4500.00"))) == Decimal("4500.00")
    assert from_micro(to_micro(Decimal("46.875"))) == Decimal("46.875000")


def test_zero_has_no_exponent_form():
    # Decimal('0E-8') is what Numeric(20,8) zero used to serialise as.
    assert str(from_micro(0)) == "0.000000"
    assert str(from_kobo(0)) == "0.00"


def test_rounding_is_half_up_and_happens_once():
    third = Decimal(1) / Decimal(3)
    assert to_micro(third) == 333333
    assert to_micro(Decimal("0.0000005")) == 1
    assert to_micro(Decimal("0.0000004")) == 0
    assert to_minor(Decimal("2.675"), 2) == 268  # not float's 2.67


def test_negative_amounts():
    assert to_micro(Decimal("-1.5")) == -1500000
    assert from_micro(-1500000) == Decimal("-1.500000")
