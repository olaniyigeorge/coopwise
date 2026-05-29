up:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

down:
docker compose down

logs:
docker compose logs -f

migrate:
docker compose exec backend alembic upgrade head

makemigration:
docker compose exec backend alembic revision --autogenerate -m "$(msg)"

seed:
docker compose exec backend python scripts/seed.py

backend:
docker compose exec backend sh

test:
docker compose exec backend pytest
