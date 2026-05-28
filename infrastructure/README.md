# Infrastructure

This directory contains all infrastructure-as-code, deployment configuration,
and environment provisioning for the Coopwise platform.

## Structure

```
infrastructure/
├── terraform/                  # Cloud resource provisioning
│   ├── environments/
│   │   ├── staging/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars.example
│   │   └── production/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── terraform.tfvars.example
│   └── modules/
│       ├── compute/            # VM / container instances
│       ├── database/           # PostgreSQL provisioning
│       ├── cache/              # Redis provisioning
│       └── networking/         # VPC, firewall rules, load balancers
│
├── docker/                     # Docker configurations beyond root docker-compose
│   ├── nginx/
│   │   └── nginx.conf
│   └── postgres/
│       └── init.sql
│
├── scripts/                    # Operational scripts
│   ├── deploy.sh               # Manual deployment trigger
│   ├── db-backup.sh            # Database backup
│   ├── db-restore.sh           # Database restore from backup
│   └── rotate-secrets.sh       # Secret rotation helper
│
└── monitoring/                 # Observability config
    ├── alerts.yml              # Alert rules (Grafana / PagerDuty)
    └── dashboards/             # Grafana dashboard JSON exports
```

## Environments

| Environment | Backend | Frontend | Database |
|---|---|---|---|
| Local | `localhost:8000` | `localhost:3000` | Docker PostgreSQL |
| Staging | Render (auto-deploy on `main`) | Vercel preview | Render PostgreSQL |
| Production | Render (manual promote) | Vercel production | Render PostgreSQL (paid) |

## Deployment

### Backend (Render)
Configured via `apps/backend/render.yaml`. Render auto-deploys on push to `main`.
Environment variables are managed in the Render dashboard — never committed.

### Frontend (Vercel)
Configured via `vercel.json` at the monorepo root. Vercel detects the Next.js
app at `apps/frontend/`. Preview deployments are created for every PR.

### CI/CD
See `.github/workflows/` for pipeline definitions:
- `ci.yml` — runs tests and linting on every PR
- `deploy.yml` — triggers production deploy after merge to `main`

## Secrets Management

Secrets are **never committed**. Each app has a `.env.sample` documenting
required variables without values. The source of truth for secrets is:

- **Local**: `.env` files (git-ignored)
- **Staging / Production**: Render environment variable groups and Vercel
  project environment variables

Required backend secrets: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`,
`PAYSTACK_SECRET_KEY`, `CASHRAMP_API_KEY`, `GEMINI_API_KEY`,
`SOLANA_RPC_URL`, `CLIENT_DOMAIN`

Required frontend secrets: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CROSSMINT_CLIENT_ID`,
`NEXT_PUBLIC_FLOW_NETWORK`

## Database Migrations

Migrations are managed with Alembic from `apps/backend/`.

```bash
# Create a new migration
cd apps/backend
alembic revision --autogenerate -m "describe_the_change"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

Migrations run automatically on deploy via `start_backend.py`.
Never run `alembic downgrade` on production without a backup.

## Local Development

The root `docker-compose.yml` spins up PostgreSQL and Redis locally.

```bash
# Start infrastructure services
docker compose up -d postgres redis

# Start backend
cd apps/backend && uvicorn main:app --reload

# Start frontend
cd apps/frontend && pnpm dev
```