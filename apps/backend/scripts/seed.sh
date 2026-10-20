docker compose exec backend sh -c \
  "python scripts/seed_beneficiary_patterns.py && python scripts/seed_goal_categories.py"