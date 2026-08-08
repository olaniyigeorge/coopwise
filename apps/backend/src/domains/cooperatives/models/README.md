# `domains/cooperatives`

Replaces `domains/circles`. Implements the Cooperative Engine from the
"Database Design: Goals + Governance Core" doc — governance/membership/
financial/decision rule modules, plus the beneficiary-pattern /
goal-category split.

## Where this goes in your tree

Drop this whole folder in as:

```
apps/backend/src/domains/cooperatives/
├── __init__.py
├── README.md
└── models/
    ├── __init__.py
    ├── enums.py
    ├── mixins.py        # Base, UUIDPrimaryKeyMixin, TimestampMixin, VersionedMixin
    ├── cooperative.py    # CoopCooperative
    ├── rules.py           # CoopGovernanceRule, CoopMembershipRule, CoopFinancialRule, CoopDecisionRule
    ├── goals.py            # CoopBeneficiaryPattern, CoopGoalCategory, CoopGoal, CoopGoalContract, CoopOwnershipShare
    └── seed.py              # seed rows for coop_beneficiary_patterns
```

## Naming convention

- **Class names:** `Coop` prefix — `CoopCooperative`, `CoopGoal`, `CoopGoalContract`, etc.
- **Table names:** `coop_` prefix — `coop_cooperatives`, `coop_goals`, `coop_goal_contracts`, etc.

This makes it unambiguous at a glance which tables belong to the new
engine vs. any legacy `circles`-domain tables still around mid-migration,
and avoids collisions if you keep both domains mounted side by side
during the cutover.

## Things you MUST adjust before this runs

1. **`mixins.py` → `from src.infra.db.base import Base`** — point this at
   your actual declarative Base / async session setup in
   `apps/backend/src/infra/db`.
2. **`users.id` foreign keys** (`created_by`, `beneficiary_user_id`,
   `CoopOwnershipShare.user_id`) — confirm the real table name for your
   existing `domains/users` model; adjusted here as a plain guess.
3. **Alembic migration** — nothing here is a migration yet, it's the
   model layer only. Once you're happy with the shape, run
   `alembic revision --autogenerate -m "add cooperative engine"` against
   this domain and review the generated DDL by hand (JSONB defaults and
   the `VersionedMixin` server_default on `effective_from` are the two
   things autogenerate tends to get slightly wrong).
4. **Cutover from `circles`** — this doesn't touch `domains/circles` or
   its existing data. You'll want a one-time data migration
   (`circles` → `coop_cooperatives`, existing group settings →
   `coop_governance_rules` / `coop_membership_rules` / `coop_financial_rules`
   rows at `version=1`) before deleting the old domain. Every place in
   `apps/backend/src/domains/{contributions,memberships,payments,...}`
   and `apps/frontend` that currently references `circle_id` will need to
   be repointed at `cooperative_id`.

## Deliberately NOT included here (see doc §7 "Next")

- Money layer: `contributions`, `wallets`, `payments`, `payouts` — these
  keep their existing domains, just repoint their FK from `circle_id` to
  `cooperative_id`.
- Trust/reputation layer: `trust_ledger_events`, `endorsements`,
  `leadership_roles`, `disputes` — not designed yet.
- Intelligence layer: `ai_insights`, `risk_flags` — not designed yet.
- Support infra: `notifications`, `analytics_snapshots` — existing
  domains, same repoint-the-FK treatment as money layer.

## Enforcing "one current-effective rule version"

`VersionedMixin` does NOT add a DB constraint for "only one row per
cooperative with `effective_to IS NULL`" — see the docstring in
`mixins.py` for why, and the partial-unique-index alternative if you'd
rather enforce it at the DB layer instead of the service layer.

## Gen 2 fixes applied (this pass)

- `uow.py`: added `CooperativeUnitOfWork = UnitOfWork` alias — three service
  files were written against a name that never existed.
- `events.py`: deduped — file previously defined the event set twice; kept
  the richer `DomainEvent`-based set, dropped the thinner early one, kept
  `EventDispatcher`/`NoOpEventDispatcher`.
- `rule_services.py` / `goal_service.py`: `create()` (and
  `create_goal_contract()`) now take `acting_user_id` and thread it into the
  `actor_id` field the corresponding events require.
- `dependencies.py`: rewritten — previously referenced undefined
  `MembershipsClient`/`Logger`/etc. and passed a raw session where services
  expected a `UnitOfWork`.
- `service.py` (flat `CooperativeGroupService`, the on-chain/Flow-coupled
  Gen 1 implementation) deleted; `router.py` and `schemas.py` rewritten
  against the Gen 2 model/service layer, dropping the Flow/USDC/invite-code
  fields that don't exist on `CoopCooperative` anymore.

**Known gaps, not fixed in this pass — see `router.py` and
`services/goal_service.py` docstrings/comments:**
- `create_goal_contract` doesn't persist a `CoopGoalContract` row yet.
- `CooperativeService.update()`/`activate()` don't check the caller's role
  — any authenticated user can currently activate/edit any cooperative.
- No exception handler maps `CooperativeDomainError` subclasses to their
  documented HTTP status codes — they'll surface as raw 500s right now.
- `RulesRepository.get_active_for_cooperative` uses `scalar_one_or_none()`
  after ordering by `version desc` — with more than one historical row for
  a cooperative this raises (`MultipleResultsFound`) instead of returning
  the top one. Needs `.limit(1)` before `scalar_one_or_none()`, or switch to
  `.scalars().first()`.
