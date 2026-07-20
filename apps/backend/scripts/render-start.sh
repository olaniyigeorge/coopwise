#!/bin/bash
set -e
set -o pipefail

# --- Celery worker (background) ---
# --without-gossip/mingle/heartbeat: on a single-instance free dyno there's
# no cluster to gossip with — this just saves RAM/CPU you don't have to spare.
celery -A src.infra.celery.app.celery_app worker \
  --loglevel=info \
  --pool=solo \
  --without-gossip --without-mingle --without-heartbeat \
  -Q celery,push,sms,email,media \
  -n combined_worker@%h &
CELERY_PID=$!

# --- API (foreground — this is what Render's health check hits via $PORT) ---
uvicorn main:app --host 0.0.0.0 --port "$PORT" &
UVICORN_PID=$!

# If either process dies, kill the other and exit non-zero so Render
# registers the crash and restarts the dyno, instead of limping along
# with a dead worker and a "healthy" API.
trap 'kill $CELERY_PID $UVICORN_PID 2>/dev/null' SIGINT SIGTERM
wait -n $CELERY_PID $UVICORN_PID
EXIT_CODE=$?
kill $CELERY_PID $UVICORN_PID 2>/dev/null
exit $EXIT_CODE