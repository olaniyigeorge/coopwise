up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

backend:
	docker compose exec backend sh

migrate:
	docker compose exec backend alembic upgrade head

makemigration:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

seed:
	docker compose exec backend python scripts/seed.py

test:
	docker compose exec backend pytest

worker:
	docker compose logs -f celery_worker