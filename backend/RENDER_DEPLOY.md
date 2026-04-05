# Deploy CoopWise backend on Render

Use `backend/render.yaml` as a blueprint, or create a **Web Service** manually with the settings below.

After pulling migrations, run **`alembic upgrade head`** (or let your deploy pipeline run it) so columns like `join_policy` exist.

## Build & start

- **Root directory**: `backend` (if the Render service is scoped to the monorepo; otherwise set **Root Directory** to `backend` in the service settings).
- **Build command**: `pip install -r requirements.txt`
- **Start command**: `python start_backend.py`  
  (starts API + Celery per your existing script; for API-only you could use `uvicorn main:app --host 0.0.0.0 --port $PORT` instead.)

## Python version

Match `render.yaml`: set **Environment** → `PYTHON_VERSION` = `3.11` (or pin in a `runtime.txt` if you prefer).

## Health check

Point the Render health check to **`/ping`** (see `main.py`). `render.yaml` uses this path.

## Required environment variables (production)

Set these in the Render dashboard (or sync from a secrets store). Names match `backend/config.py` / `.env`:

| Variable | Notes |
|----------|--------|
| `ENV` | `production` |
| `PORT` | Usually injected by Render (`10000`); your app reads `PORT`. |
| `RENDER` | `true` (already in `render.yaml`; enables production paths in `start_backend.py`). |
| `DATABASE_URL` | **PostgreSQL** connection string from Render Postgres (async driver: project uses `postgresql+asyncpg://...`). |
| `REDIS_URL` | **Redis** URL from Render Redis or Upstash. |
| `APP_SECRET_KEY` | Strong random secret for JWT/signing. |
| `ALGORITHM` | `HS256` (default). |
| `DOMAIN` | Public API base URL, e.g. `https://your-service.onrender.com` |
| `CLIENT_DOMAIN` | **Frontend origin** for CORS (single URL), e.g. `https://your-app.vercel.app` — must match the browser origin exactly. |
| `INVITE_CODE_PREFIX` | e.g. `CPW-INV-` |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | From Paystack dashboard (test vs live). |
| `OPENAI_API_KEY` | **Required** for AI chat and AI-generated insights (OpenAI). |
| `OPENAI_CHAT_MODEL` | Optional; default `gpt-4o-mini`. |
| `CASHRAMP_API_KEY` | CashRamp GraphQL bearer token (use this name in production). |
| `GEMINI_API_KEY` | Optional legacy fallback: if set and `CASHRAMP_API_KEY` is empty, used as CashRamp bearer (historical misname). |
| `RATE_LIMIT_RULES_PATH` | e.g. `app/rate_limit_rules.json` |

Copy from `backend/env.sample` and fill values; **never commit** real secrets (`.env` is gitignored).

## Frontend (Vercel / Next.js)

Point the web app at this API:

- `NEXT_PUBLIC_API_URL=https://your-service.onrender.com`
- `NEXT_PUBLIC_WS_URL=wss://your-service.onrender.com` (if you use websockets to the same host)
- Server-side Next proxies: optional `BACKEND_URL` = same URL as above.

After deploy, confirm CORS: if the site still blocks requests, verify `CLIENT_DOMAIN` matches the exact frontend URL (scheme + host, no trailing slash mismatch).

## What not to commit

Local-only files (see repo `.gitignore`): SQLite dev DB, optional local Redis shim, and local `.env` files.
