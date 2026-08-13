"""
Seed data for `coop_beneficiary_patterns`.

Run once via a data migration (Alembic) or `scripts/seed.sh` — these four
rows are the deliberately-controlled catalog described in the design doc.
Do NOT expose an admin UI that inserts into this table freely; new
patterns require code changes (contract_schema + exit/dispute logic).
"""

from src.domains.cooperatives.models.enums import BeneficiaryPatternCode

BENEFICIARY_PATTERN_SEED = [
    {
        "code": BeneficiaryPatternCode.ROTATING_TRACKED.value,
        "name": "Rotating, but tracked",
        "description": (
            "Individual payouts on a rotation; outcomes roll up into "
            "cumulative group impact. Traditional ajo/esusu rotation."
        ),
        "requires_beneficiary": False,
        "requires_ownership_shares": False,
        "requires_claim_process": False,
        "default_visibility": "group",
        "default_withdrawal_restriction": "on_payout_turn",
        "contract_schema": {
            "required_fields": ["visibility", "withdrawal_restriction", "deadline"]
        },
    },
    {
        "code": BeneficiaryPatternCode.POOLED_FOR_ONE.value,
        "name": "Pooled for one",
        "description": ("Group funds one member's goal (rent, travel, equipment)."),
        "requires_beneficiary": True,
        "requires_ownership_shares": False,
        "requires_claim_process": False,
        "default_visibility": "group",
        "default_withdrawal_restriction": "beneficiary_only",
        "contract_schema": {
            "required_fields": [
                "beneficiary_user_id",
                "deadline",
                "withdrawal_restriction",
            ]
        },
    },
    {
        "code": BeneficiaryPatternCode.POOLED_FOR_SHARED.value,
        "name": "Pooled for shared",
        "description": (
            "Goal is a jointly-owned asset (equipment, business) that "
            "stays with the group."
        ),
        "requires_beneficiary": False,
        "requires_ownership_shares": True,
        "requires_claim_process": False,
        "default_visibility": "group",
        "default_withdrawal_restriction": "locked_until_exit",
        "contract_schema": {"required_fields": ["exit_rule_type", "valuation_method"]},
    },
    {
        "code": BeneficiaryPatternCode.POOLED_CONTINGENT.value,
        "name": "Pooled, contingent",
        "description": (
            "Reserve pool; payout is triggered by a qualifying event, not "
            "rotation or a fixed beneficiary. Insurance, healthcare fund, "
            "security/emergency fund."
        ),
        "requires_beneficiary": False,
        "requires_ownership_shares": False,
        "requires_claim_process": True,
        "default_visibility": "group",
        "default_withdrawal_restriction": "claim_approval_required",
        "contract_schema": {"required_fields": ["claim_eligibility_criteria"]},
    },
]
