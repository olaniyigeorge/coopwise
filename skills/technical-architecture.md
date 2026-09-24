# CoopWise — Technical Architecture & Conventions (Reference)

Read this before writing or reviewing code anywhere in the repo. It captures both the current structure and the standing conventions Olaniyi builds with — match these rather than introducing a new pattern, unless there's a specific reason to deviate (state the reason if you do).

## Monorepo Shape

```
apps/
├── backend/      FastAPI, DDD-style domains, Alembic migrations, Celery workers
├── frontend/     Next.js (App Router), TypeScript
└── mobile/       placeholder, not yet built out
packages/
├── config/       shared config
└── types/        shared types across apps
```

Root-level: Docker Compose (dev/prod), Makefile, GitHub Actions CI, `docs/` for internal design notes.

## Backend (`apps/backend`)

**Stack:** FastAPI, SQLAlchemy 2.0 (async), Alembic, Celery + Redis, asyncpg, PostgreSQL.

**Domain-driven layout** — `src/domains/` is the core organizing principle, each domain owns its own models/schemas/routes/services:

```
domains/
├── ai_chat
├── analytics
├── auth
├── contributions
├── cooperatives
├── dashboard
├── insights
├── kyc
├── memberships
├── notifications
├── payments
├── support
├── users
└── wallets
```

New backend features should slot into the existing domain they belong to, or justify a new domain — don't scatter logic across domains or reach into another domain's internals directly; go through its service layer (ports-and-adapters style).

**Infra layer** (`src/infra/`) — cross-cutting technical concerns, kept separate from domain logic:

```
infra/
├── blockchain      # Flow/Crossmint wallet integration
├── cache
├── celery
├── db
├── emails
├── exchange
├── payments
├── security
├── storage         # Cloudinary
└── wallet_client.py
```

**Shared** (`src/shared/`) — cross-domain utilities: `exceptions.py`, `idempotency/`, `ratelimit/`, `responses.py`, `security/`, `utils/`.

### Key backend conventions locked in from prior work

- **Async SQLAlchemy 2.0 patterns** throughout — don't introduce sync ORM calls.
- **Celery workers**: watch for circular imports and broker URL misconfiguration; use `NullPool` for asyncpg to keep worker DB connections fork-safe. This has bitten the project before — check for it when touching Celery config.
- **Redis-backed rate limiting and idempotency** are established infra (`shared/ratelimit`, `shared/idempotency`) — reuse these rather than building ad hoc versions per endpoint.
- **JWT: ES256 asymmetric signing** (not HS256) — this was a deliberate migration to support Crossmint BYOA (bring-your-own-auth) wallet integration. Keep new auth work on ES256.
- **KYC domain**: multi-step submission flow, admin dashboard with audit trails, Cloudinary document storage, fuzzy name matching via `rapidfuzz` for identity verification. Treat KYC as a first-class domain with its own audit trail requirements — this is regulated-adjacent territory, don't cut corners on traceability.
- **Wallet integration**: Crossmint (BYOA wallet) + Flow blockchain, via `infra/blockchain` and `infra/wallet_client.py`. This is the pluggable Web3 layer referenced in the roadmap — treat it as an adapter behind the wallet domain's service interface, not something the rest of the app talks to directly.

## Frontend (`apps/frontend`)

**Stack:** Next.js App Router, TypeScript, Tailwind, shadcn/ui-style components, Zustand-pattern stores.

**Route structure:**
```
app/
├── (auth)/          signin, signup, password reset, profile-setup
├── (marketing)/      about-us, how-it-works, contact, privacy, terms, support
├── api/               Next.js route handlers proxying the FastAPI backend (auth, kyc, cooperatives, circles, groups, dashboard, memberships, users, v1)
├── dashboard/         the core app surface: accounts, admin, ai-chat, ai-insights, circle, contributions, create-circle/cooperative/group, discover-groups, kyc, leaderboard, messages, my-group, notifications, payouts, profile, wallet
├── onboarding/
└── invite/[code]/
```

**Supporting layers:**
- `components/` — organized by domain (auth, circle, cooperative, dashboard, admin/kyc, payout, invite, homepage, about) plus a shared `ui/` primitives folder (shadcn-derived).
- `services/` — one service file per domain (`kyc-service.ts`, `wallet-service.ts`, `cooperative-service.ts`, etc.) — this is the established pattern for talking to the backend; new features should add a service file rather than calling `fetch` directly from components.
- `stores/` — client state (`auth-store.ts`, `group-store.ts`, `notification-store.ts`, `cooperative-creation-store.ts`, `goal-creation-store.ts`).
- `lib/` — auth (JWT handling, refresh, events), Crossmint sync service, Flow account/config, hooks, server-side backend URL helpers.
- `hooks/` — domain hooks (`useCircle`, `useContribution`, `useLeaderboard`, `useMyPayouts`, `useCampConnect`).

### Design system

- **Brand tokens:** `brand-ink`, `brand-paper`, `brand-gold`, plus a primary teal — these are the current palette, not placeholders. Use them rather than introducing new arbitrary colors.
- **Motif:** ledger / tally-mark visual language runs through the product — most visibly as a tally-mark progress indicator in the multi-step onboarding wizard. New progress/status UI should consider extending this motif rather than defaulting to generic progress bars, where it fits.
- Component styling follows shadcn/ui conventions (`components.json`, `components/ui/*`).

## Standing Engineering Conventions (apply across the whole repo)

- **Ports-and-adapters architecture** — domain logic stays independent of infra details (DB, blockchain, storage, email); infra is swappable behind service interfaces. This shows up as the `domains/` vs `infra/` split in the backend and the `services/` layer in the frontend.
- **Atomic git commits organized by logical concern** — one concern per commit, not sprawling multi-purpose commits. This matters for the review trail on security/auth-sensitive work in particular.
- **DDD domain reorganization** is the established pattern (mirrors the refactor pattern used on the Winnov8 backend) — when a feature grows past a single file, split by domain, not by technical layer alone.
- **Communication register**: direct, expert-level, minimal filler — code comments, PR descriptions, and docstrings should assume a competent engineer reader, not explain basics.

## Where to Look First for X

| Task | Start here |
|---|---|
| New API endpoint | `apps/backend/src/domains/<domain>/` |
| Auth/session/JWT work | `apps/backend/src/domains/auth/`, `infra/security`, `shared/security` |
| KYC flow changes | `apps/backend/src/domains/kyc/`, `frontend/components/admin/kyc`, `frontend/app/dashboard/kyc` |
| Wallet/blockchain work | `apps/backend/src/infra/blockchain`, `infra/wallet_client.py`, `frontend/lib/crossmint`, `frontend/lib/flow` |
| Celery/async jobs | `apps/backend/src/infra/celery`, `scripts/worker.sh`, `scripts/beat.sh` |
| Rate limiting / idempotency | `apps/backend/src/shared/ratelimit`, `shared/idempotency`, `rate_limit_rules.json` |
| New goal/beneficiary-pattern logic | `apps/backend/src/domains/cooperatives`, `contributions`, `memberships` — check it respects the beneficiary-pattern model in `business-thesis.md` before adding |
| Frontend data fetching for a domain | Check `services/<domain>-service.ts` first — add to it rather than a new pattern |
| Design/visual work | Confirm brand tokens + tally-mark motif above before picking colors/progress UI |

If a task doesn't map cleanly to an existing domain or pattern above, flag that explicitly rather than silently inventing a new structure — it may be a genuinely new domain, or it may belong inside an existing one.