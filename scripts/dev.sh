#!/bin/bash
set -e
set -o pipefail   # NEW: without this, `celery ... | tee file` always "succeeds"
                   # from bash's point of view even if celery itself crashed,
                   # since tee is the last command in the pipe. That's how a
                   # dead worker goes unnoticed.
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

echo -e "${GREEN}Starting CoopWise dev environment...${NC}"

# --- Start Postgres ---
echo -e "${YELLOW}Starting PostgreSQL...${NC}"
if ! pg_isready -q 2>/dev/null; then
  pg_ctlcluster 16 main start
  sleep 2
else
  echo "PostgreSQL already running."
fi

# --- Start Redis ---
echo -e "${YELLOW}Starting Redis...${NC}"
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
  echo "No venv found, creating one..."
  python3 -m venv "$BACKEND_DIR/venv"
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
: > "$CELERY_LOG"   # NEW: truncate so old runs don't mislead you into
                     # thinking a stale log line is from this run

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

# NEW: don't just assume the worker came up — prove it. This is the
# single biggest source of "jobs silently don't run": the worker process
# died on startup (import error, bad broker URL, etc.) and nothing in the
# interleaved terminal output made that obvious.
echo -e "${YELLOW}Waiting for Celery worker to report ready...${NC}"
WORKER_UP=0
for i in $(seq 1 15); do
  if "$BACKEND_DIR/venv/bin/celery" -A src.infra.celery.app.celery_app \
      inspect ping -d auth_worker@$(hostname) --timeout 1 &>/dev/null; then
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
  API Docs: http://localhost:8000/docs
  Celery log: $CELERY_LOG
====================================
${NC}"

cleanup() {
  echo -e "\n${RED}Shutting down...${NC}"
  kill -- -$BACKEND_PID 2>/dev/null
  kill -- -$FRONTEND_PID 2>/dev/null
  kill -- -$CELERY_PID 2>/dev/null
  redis-cli shutdown 2>/dev/null || true
  echo -e "${GREEN}All services stopped. (Postgres left running)${NC}"
}

trap cleanup SIGINT SIGTERM
wait