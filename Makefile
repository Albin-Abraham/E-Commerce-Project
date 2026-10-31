APP_NAME=zenos-commerce
COMPOSE=docker compose
ENV?=dev
ENV_FILE=.env

VERSION ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")
IMAGE ?= registry/$(APP_NAME):$(VERSION)

.PHONY: up down restart teardown clean prune build migrate check-migrate logs shell \
	make-schema make-data verify-migrations migration-status migration-backup \
	migration-squash make-config ping start adminer postgres redis \
	seed-data seed-modules seed-config seed-admin seed-master seed-all seed-dummy \
	seed-ecommerce seed-ecommerce-catalog seed-ecommerce-inventory seed-ecommerce-pricing \
	seed-ecommerce-dry seed-ecommerce-validate \
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
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web sh -c "while ! nc -z postgres 5432; do echo 'Waiting for Postgres...'; sleep 2; done; python manage.py migrate"

check-migrate:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py showmigrations

make-schema:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py make_schema --name $(name)

make-data:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py make_data --app $(app) --name $(name)

verify-migrations:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py verify_migrations

migration-status:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py migration_status

migration-backup:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py migration_backup --app_label $(app)

migration-squash:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py migration_squash $(app) $(START) $(END)

make-config:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py generate_config

# --- Seeding & Setup ---
seed-data:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --section $(section)

seed-modules:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --section modules

seed-config:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --section system_config

seed-admin:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --section superadmin

seed-master:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --section master_data

seed-dummy:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seed_dummy_data

seed-all: seed-modules seed-config seed-admin seed-master

seed-ecommerce:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --domain ecommerce

seed-ecommerce-catalog:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --domain ecommerce --section catalog

seed-ecommerce-inventory:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --domain ecommerce --section inventory

seed-ecommerce-pricing:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --domain ecommerce --section pricing

seed-ecommerce-dry:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --domain ecommerce --dry-run

seed-ecommerce-validate:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web python manage.py seeds_data --domain ecommerce --validate-only

# --- Debugging & Utilities ---
logs:
	$(COMPOSE) --env-file $(ENV_FILE) logs -f

shell:
	$(COMPOSE) --env-file $(ENV_FILE) exec django-web /bin/sh

# Ping a service to check network connectivity
ping:
	$(COMPOSE) --env-file $(ENV_FILE) run --rm django-web sh -c "ping -c 4 $(svc)"

# --- Quality & Linting ---
fitness:
	./scripts/architecture/run_fitness_functions.sh

lint:
	./tools/quality/orchestrator/check.sh fast

format:
	./tools/quality/orchestrator/check.sh fast --fix

check:
	./tools/quality/orchestrator/check.sh full

ci:
	./tools/quality/orchestrator/check.sh ci

test:
	$(COMPOSE) --env-file $(ENV_FILE) exec -T django-web pytest

# Kubernetes
k8-apply:
	kubectl apply -f k8/
