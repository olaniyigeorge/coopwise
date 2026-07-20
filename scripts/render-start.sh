#!/bin/bash
# render-start.sh — single-service combo of API + Celery worker(s)
set -e
set -o pipefail

cd apps/backend

# Celery worker (background)
celery -A src.infra.celery.app.celery_app worker \
  --loglevel=info \
  --pool=solo \
  -Q celery,push,sms,email,media \
  -n combined_worker@%h &
CELERY_PID=$!

# API (foreground — this is what Render health-checks via $PORT)
uvicorn main:app --host 0.0.0.0 --port "$PORT" &
UVICORN_PID=$!

# If either dies, kill the other and exit non-zero so Render restarts us
trap 'kill $CELERY_PID $UVICORN_PID 2>/dev/null' SIGINT SIGTERM
wait -n $CELERY_PID $UVICORN_PID
EXIT_CODE=$?
kill $CELERY_PID $UVICORN_PID 2>/dev/null
exit $EXIT_CODE