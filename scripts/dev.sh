#!/bin/bash
set -e
set -o pipefail   # without this, `celery ... | tee file` always "succeeds"
                  # since tee is the last command in the pipe, so a dead
                  # worker goes unnoticed.
set -m

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"
FRONTEND_DIR="$PROJECT_ROOT/apps/frontend"

# Local development must not silently connect to a hosted/production database.
# Set ALLOW_REMOTE_DATABASE=true only when a remote database is intentional.
if [ -n "${DATABASE_URL:-}" ]; then
  CONFIGURED_DATABASE_URL="$DATABASE_URL"
else
  CONFIGURED_DATABASE_URL="$(awk -F= '/^DATABASE_URL=/{sub(/^DATABASE_URL=/, ""); print; exit}' "$BACKEND_DIR/.env" 2>/dev/null || true)"
fi
DATABASE_HOST="$(printf '%s\n' "$CONFIGURED_DATABASE_URL" | sed -E 's#^[^:]+://([^@]+@)?([^:/]+).*#\2#')"
case "$DATABASE_HOST" in
  localhost|127.0.0.1|postgres|"" ) ;;
  *)
    if [ "${ALLOW_REMOTE_DATABASE:-false}" != "true" ]; then
      echo -e "${RED}Refusing to start: local dev is configured for remote database host '$DATABASE_HOST'.${NC}"
      echo "Set DATABASE_URL to a local database, use docker-compose.dev.yml, or explicitly set ALLOW_REMOTE_DATABASE=true."
      exit 1
    fi
    echo -e "${YELLOW}WARNING: local dev is using remote database host '$DATABASE_HOST'.${NC}"
    ;;
esac

# --- macOS: make Homebrew and the EDB Postgres tools visible ---
# (a fresh terminal/script doesn't always have these on PATH)
[ -d /opt/homebrew/bin ] && export PATH="/opt/homebrew/bin:$PATH"
[ -d /Library/PostgreSQL/18/bin ] && export PATH="/Library/PostgreSQL/18/bin:$PATH"

# --- Pick a Python >= 3.10 for the venv (system python3 on macOS is 3.9) ---
if command -v python3.12 >/dev/null 2>&1; then
  PYTHON_BIN="python3.12"
elif command -v python3.11 >/dev/null 2>&1; then
  PYTHON_BIN="python3.11"
elif command -v python3.10 >/dev/null 2>&1; then
  PYTHON_BIN="python3.10"
else
  PYTHON_BIN="python3"
fi

echo -e "${GREEN}Starting CoopWise dev environment...${NC}"

# --- Start Postgres ---
echo -e "${YELLOW}Starting PostgreSQL...${NC}"
if ! command -v pg_isready >/dev/null 2>&1; then
  echo -e "${RED}pg_isready not found on PATH. Install PostgreSQL client tools or fix PATH.${NC}"
  exit 1
fi

if ! pg_isready -q -h localhost -p 5432 2>/dev/null; then
  if command -v pg_ctlcluster >/dev/null 2>&1; then
    # Debian/Ubuntu
    pg_ctlcluster 16 main start
    sleep 2
  else
    echo -e "${RED}Postgres isn't running on :5432.${NC}"
    echo "Start it first, e.g. (EDB install):"
    echo "  sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl -D /Library/PostgreSQL/18/data start"
    echo "or (Homebrew): brew services start postgresql@18"
    exit 1
  fi
else
  echo "PostgreSQL already running."
fi

# --- Start Redis ---
echo -e "${YELLOW}Starting Redis...${NC}"
if ! command -v redis-cli >/dev/null 2>&1 || ! command -v redis-server >/dev/null 2>&1; then
  echo -e "${RED}Redis not installed. Run: brew install redis${NC}"
  exit 1
fi

if ! redis-cli ping &>/dev/null; then
  redis-server --daemonize yes --logfile /tmp/redis.log
  sleep 1
else
  echo "Redis already running."
fi

echo -e "${GREEN}Postgres and Redis are up.${NC}"

# --- Backend ---
echo -e "${YELLOW}Starting backend...${NC}"

if [ ! -d "$BACKEND_DIR/venv" ]; then
  echo "No venv found, creating one with $PYTHON_BIN..."
  "$PYTHON_BIN" -m venv "$BACKEND_DIR/venv"
fi

# Install deps if uvicorn is missing (covers a venv left half-built by a failed install)
if [ ! -x "$BACKEND_DIR/venv/bin/uvicorn" ]; then
  echo "Installing backend requirements..."
  "$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
fi

(
  cd "$BACKEND_DIR" && \
  "$BACKEND_DIR/venv/bin/uvicorn" main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload
) &
BACKEND_PID=$!

# --- Celery Worker ---
echo -e "${YELLOW}Starting Celery worker...${NC}"
mkdir -p "$PROJECT_ROOT/logs"
CELERY_LOG="$PROJECT_ROOT/logs/celery.log"
: > "$CELERY_LOG"   # truncate so stale log lines don't mislead you

# --- Notifications + default worker ---
(
  cd "$BACKEND_DIR" && \
  "$BACKEND_DIR/venv/bin/celery" -A src.infra.celery.app.celery_app worker \
    --loglevel=info \
    --pool=solo \
    -Q celery,push,sms,email \
    -n default_worker@%h \
    2>&1 | tee -a "$CELERY_LOG"
) &
DEFAULT_WORKER_PID=$!

# --- Media worker (avatar/image uploads) ---
# Isolated on its own queue + process so a slow Cloudinary upload
# can never delay push/sms/email delivery.
MEDIA_LOG="$PROJECT_ROOT/logs/media_worker.log"
: > "$MEDIA_LOG"
(
  cd "$BACKEND_DIR" && \
  "$BACKEND_DIR/venv/bin/celery" -A src.infra.celery.app.celery_app worker \
    --loglevel=info \
    --pool=solo \
    -Q media \
    -n media_worker@%h \
    2>&1 | tee -a "$MEDIA_LOG"
) &
MEDIA_WORKER_PID=$!

# Prove the worker came up instead of assuming it did.
# FIXED: ping default_worker (the name actually used above), not auth_worker.
echo -e "${YELLOW}Waiting for Celery worker to report ready...${NC}"
WORKER_UP=0
for i in $(seq 1 15); do
  if "$BACKEND_DIR/venv/bin/celery" -A src.infra.celery.app.celery_app \
      inspect ping -d "default_worker@$(hostname)" --timeout 1 &>/dev/null; then
    WORKER_UP=1
    break
  fi
  sleep 1
done

if [ "$WORKER_UP" -eq 1 ]; then
  echo -e "${GREEN}Celery worker is up and responding to pings.${NC}"
else
  echo -e "${RED}Celery worker did NOT respond to ping after 15s — check $CELERY_LOG${NC}"
fi

# --- Frontend ---
echo -e "${YELLOW}Starting frontend...${NC}"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "node_modules not found, running npm install..."
  npm --prefix "$FRONTEND_DIR" install
fi

npm --prefix "$FRONTEND_DIR" run dev &
FRONTEND_PID=$!

echo -e "${GREEN}
====================================
  CoopWise is running!
  Backend:  http://localhost:8000
  Frontend: http://localhost:3000
  API Docs: http://localhost:8000/api/docs
  Celery log: $CELERY_LOG
====================================
${NC}"

cleanup() {
  echo -e "\n${RED}Shutting down...${NC}"
  # FIXED: kill the PIDs that actually exist (was $CELERY_PID, never set).
  # `|| true` so one failed kill doesn't abort cleanup under `set -e`.
  kill -- -$BACKEND_PID 2>/dev/null || true
  kill -- -$FRONTEND_PID 2>/dev/null || true
  kill -- -$DEFAULT_WORKER_PID 2>/dev/null || true
  kill -- -$MEDIA_WORKER_PID 2>/dev/null || true
  redis-cli shutdown 2>/dev/null || true
  echo -e "${GREEN}All services stopped. (Postgres left running)${NC}"
}

trap cleanup SIGINT SIGTERM
wait
