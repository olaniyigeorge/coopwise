from typing import Literal

from rapidfuzz import fuzz
import re

def _normalize_name(name: str) -> str:
    name = name.upper().strip()
    name = re.sub(r"[.,'-]", " ", name)
    name = re.sub(r"\s+", " ", name)
    # strip common titles/honorifics that show up in bank records
    name = re.sub(r"\b(MR|MRS|MISS|DR|ENGR|CHIEF|ALHAJI|ALHAJA)\b", "", name)
    return name.strip()

def _names_reasonably_match(bank_name: str, kyc_name: str, threshold: int = 82) -> bool:
    if not bank_name or not kyc_name:
        return False
    a, b = _normalize_name(bank_name), _normalize_name(kyc_name)
    if a == b:
        return True
    # token_sort_ratio handles reordering ("Olaniyi Adebayo" vs "Adebayo Olaniyi")
    # token_set_ratio additionally handles missing/extra tokens (middle names)
    score = max(fuzz.token_sort_ratio(a, b), fuzz.token_set_ratio(a, b))
    return score >= threshold


def classify_name_match(bank_name: str, kyc_name: str) -> Literal["match", "review", "no_match"]:
    a, b = _normalize_name(bank_name), _normalize_name(kyc_name)
    score = max(fuzz.token_sort_ratio(a, b), fuzz.token_set_ratio(a, b))
    print(score)
    if score >= 90:
        return "match"
    if score >= 70:
        return "review"
    return "no_match"