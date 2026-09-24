# CoopWise

**CoopWise is trust infrastructure for groups that do business together, not just save together.** It digitizes cooperative savings models like Ajo, Esusu, and Chamas — group/cooperative creation, goal-gated contribution tracking, KYC, wallet infrastructure, and AI-driven cooperative insights — with a pluggable Web3 layer (Flow blockchain + Crossmint wallets) underneath.

See [`skills/SKILL.md`](skills/SKILL.md) for the full product thesis, roadmap, and technical conventions. That's the source of truth for direction — read it before making product or architecture calls. Older/superseded planning docs live in [`docs/archive/`](docs/archive/) for historical reference only.

## Key features

- Authentication & identity verification (JWT, ES256, KYC with audit trail)
- Group/cooperative creation, joining, and discovery
- Goal-gated contribution tracking (rotating-but-tracked, pooled-for-one, pooled-for-shared)
- Wallet infrastructure via Crossmint (BYOA) + Flow blockchain
- AI-powered cooperative insights & financial nudges
- Real-time notifications & invitations
- Admin/support channels for dispute resolution
- AI chat (beta)

## Project structure

```
coopwise/                      # monorepo root
├── apps/
│   ├── backend/                # FastAPI, DDD-style domains, Alembic, Celery
│   │   └── src/
│   │       ├── domains/         # auth, cooperatives, contributions, memberships,
│   │       │                    # wallets, payments, kyc, notifications, insights,
│   │       │                    # analytics, dashboard, ai_chat, users, support
│   │       ├── infra/           # blockchain (Flow/Crossmint), db, cache, celery,
│   │       │                    # emails, exchange, payments, security, storage
│   │       └── shared/          # exceptions, idempotency, ratelimit, security, utils
│   ├── frontend/               # Next.js (App Router), TypeScript, Tailwind, shadcn/ui
│   └── mobile/                 # placeholder, not yet built out
├── packages/
│   ├── config/                  # shared config across apps
│   └── types/                   # shared TypeScript types
├── skills/                     # locked product thesis, roadmap, and architecture reference
├── docs/                       # deploy runbooks and feature-specific dev docs
│   └── archive/                 # superseded planning docs, kept for history
└── docker-compose*.yml, Makefile, scripts/
```

## Tech stack

| Layer       | Technology                                                   |
|-------------|---------------------------------------------------------------|
| Frontend    | Next.js (App Router), TypeScript, Tailwind, shadcn/ui          |
| Backend     | FastAPI, PostgreSQL, SQLAlchemy 2.0 (async), Alembic, Redis, Celery |
| Wallets     | Crossmint (BYOA), Flow blockchain                              |
| AI Stack    | Google Gemini                                                  |
| Auth        | JWT (ES256), email as username, role-based access              |
| Payments    | Paystack, CashRamp                                              |
| Infra       | Docker, Render/Vercel                                           |

## Getting started

### Backend

```bash
cd apps/backend
cp .env.sample .env
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

### Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

### Docker (all services)

```bash
make up      # docker compose up --build (dev)
make migrate # run alembic migrations in the backend container
make seed    # seed dev data
make logs
make down
```

## API overview

Base URL: `/api/v1`

| Route | Description |
|---|---|
| `/auth` | Login, register, verify |
| `/users` | Profile, KYC, me |
| `/cooperatives` | Create, join, discover |
| `/memberships` | Invite, accept, roles |
| `/contributions` | Make, view, summary |
| `/wallet` | Fund wallet, view balance |
| `/dashboard` | AI insights, analytics |
| `/notifications` | Realtime alerts |
| `/ai-chat` | Chat interface (beta) |

## Testing

```bash
make test        # backend: pytest, via docker compose
cd apps/frontend && npm test
```

## Contribution guidelines

- Use feature branches
- Follow PEP8 for Python and the repo's ESLint config for TypeScript
- One concern per commit — atomic, logically-scoped commits
- New backend features slot into an existing domain in `apps/backend/src/domains/`, or justify a new one
- Read `skills/SKILL.md` before code, copy, or roadmap work — it keeps output anchored to the locked thesis and conventions

## License

MIT License. See `LICENSE.md`.
