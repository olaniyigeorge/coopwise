#!/bin/bash

set -e
set -o pipefail

cd apps/backend

echo "Running database migrations..."
alembic upgrade head

echo "Starting Celery..."
celery -A src.infra.celery.app.celery_app worker \
  --loglevel=info \
  --pool=solo \
  -Q celery,push,sms,email,media \
  -n combined_worker@%h &
CELERY_PID=$!

echo "Starting API..."
uvicorn main:app --host 0.0.0.0 --port "$PORT" &
UVICORN_PID=$!

trap 'kill $CELERY_PID $UVICORN_PID 2>/dev/null' SIGINT SIGTERM

wait -n $CELERY_PID $UVICORN_PID
EXIT_CODE=$?

kill $CELERY_PID $UVICORN_PID 2>/dev/null
exit $EXIT_CODE