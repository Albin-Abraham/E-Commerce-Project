APP_NAME=backend-restful
COMPOSE=docker compose
ENV?=dev
ENV_FILE=.env

VERSION ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")
IMAGE ?= registry/$(APP_NAME):$(VERSION)

.PHONY: up down restart teardown clean prune build migrate check-migrate logs shell \
	make-schema make-data verify-migrations migration-status migration-backup \
	migration-squash make-config ping start adminer postgres redis \
	seed-data seed-modules seed-config seed-admin seed-all seed-dummy \
	lint-imports lint test check k8-apply

# --- Core Lifecycle ---
up:
	$(COMPOSE) --env-file $(ENV_FILE) up -d --build

# Start a specific service (usage: make start svc=name)
start:
	$(COMPOSE) --env-file $(ENV_FILE) up -d $(svc)

# Convenience target for adminer
adminer:
	$(COMPOSE) --env-file $(ENV_FILE) up -d adminer

# Postgres
postgres:
	$(COMPOSE) --env-file $(ENV_FILE) up -d postgres

# Redis
redis:
	$(COMPOSE) --env-file $(ENV_FILE) up -d redis

down:
	$(COMPOSE) --env-file $(ENV_FILE) down

restart:
	$(COMPOSE) --env-file $(ENV_FILE) restart

teardown:
	$(COMPOSE) --env-file $(ENV_FILE) down -v --remove-orphans

# Thorough cleanup of containers, networks, and volumes
clean:
	$(COMPOSE) --env-file $(ENV_FILE) down -v --remove-orphans
	docker network prune -f
	docker volume prune -f

# Total system prune (use with caution)
prune: clean
	docker system prune -f --volumes

build:
	docker build -t $(IMAGE) .

# --- Database & Migrations ---
# Run migrations safely after services are healthy
migrate:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web sh -c "while ! nc -z postgres 5432; do echo 'Waiting for Postgres...'; sleep 2; done; python manage.py migrate"

check-migrate:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py showmigrations

make-schema:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py make_schema --name $(name)

make-data:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py make_data --app $(app) --name $(name)

verify-migrations:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py verify_migrations

migration-status:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py migration_status

migration-backup:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py migration_backup --app_label $(app)

migration-squash:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py migration_squash $(app) $(START) $(END)

make-config:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py generate_config

# --- Seeding & Setup ---
seed-data:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py seeds_data --section $(section)

seed-modules:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py seeds_data --section modules

seed-config:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py seeds_data --section system_config

seed-admin:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py seeds_data --section superadmin

seed-dummy:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python manage.py seed_dummy_data

seed-all: seed-modules seed-config seed-admin

# --- Debugging & Utilities ---
logs:
	$(COMPOSE) --env-file $(ENV_FILE) logs -f

shell:
	$(COMPOSE) --env-file $(ENV_FILE) exec web /bin/sh

# Ping a service to check network connectivity
ping:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web sh -c "ping -c 4 $(svc)"

# --- Quality & Linting ---
lint-imports:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python scripts/check_import_dag.py

lint: lint-imports

test:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm web python -m pytest

check: lint test check-migrate

# Kubernetes
k8-apply:
	kubectl apply -f k8/
