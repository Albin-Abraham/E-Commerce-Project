# ==============================================================================
# Makefile for React Vite Frontend Project
# ==============================================================================

.PHONY: help install env-init env-check dev build clean lint test test-e2e storybook \
        tokens-check scaffold up down docker-build docker-logs docker-restart teardown

# Default target when running `make`
.DEFAULT_GOAL := help

# The compose file lives in docker/ alongside the Dockerfile it builds.
COMPOSE := docker compose -f docker/docker-compose.yml

help: ## Display available commands
	@echo "Usage: make [target]"
	@echo ""
	@echo "Development:"
	@echo "  dev             Start local Vite development server"
	@echo "  install         Install project dependencies with pnpm"
	@echo "  env-init        Materialise .env / .env.<mode> from .env.example + docker/env/"
	@echo "  env-check       Verify the generated .env* files are present"
	@echo "  storybook       Start Storybook development UI"
	@echo "  tokens-check    Check design tokens integrity"
	@echo "  scaffold        Run component generator"
	@echo ""
	@echo "Build & Quality:"
	@echo "  build           Run integrity checks and build production assets"
	@echo "  lint            Run ESLint code quality checks"
	@echo "  test            Run Vitest unit tests"
	@echo "  test-e2e        Run Playwright end-to-end tests"
	@echo "  clean           Remove build outputs and cache files"
	@echo ""
	@echo "Docker Lifecycle & Reset:"
	@echo "  up              Start the container in detached mode"
	@echo "  down            Stop and remove the container"
	@echo "  docker-build    Rebuild the image from scratch"
	@echo "  docker-logs     Tail container logs"
	@echo "  docker-restart  Restart the container"
	@echo "  teardown        Complete environment reset (containers, volumes, images & caches)"
	@echo ""
	@echo "All container commands run: $(COMPOSE)"

install: ## Install dependencies using pnpm
	pnpm install

env-init: ## Generate .env and .env.<mode> from .env.example + docker/env/
	node scripts/ensure-env.js

env-check: ## Verify the generated .env* files are present
	node scripts/ensure-env.js --check

dev: ## Start Vite development server
	pnpm dev

build: ## Build production application
	pnpm build

clean: ## Clean build assets and logs
	rm -rf dist storybook-static playwright-report test-results *.log stats.html node_modules/.vite

lint: ## Run linter
	pnpm lint

test: ## Run unit tests
	pnpm test

test-e2e: ## Run E2E tests with Playwright
	pnpm test:e2e

storybook: ## Start Storybook dev server
	pnpm storybook

tokens-check: ## Run design tokens integrity check
	pnpm tokens:check

scaffold: ## Run component scaffolding tool
	pnpm scaffold

up: ## Start the container in detached mode
	$(COMPOSE) up -d

down: ## Stop and remove the container
	$(COMPOSE) down

docker-build: ## Rebuild the image from scratch
	$(COMPOSE) build --no-cache

serve: ## Serve production build using npx serve
	npx serve -s dist -l $${VITE_PORT:-8090}

docker-logs: ## Follow container logs
	$(COMPOSE) logs -f

docker-restart: ## Restart the container
	$(COMPOSE) restart

teardown: ## Completely tear down Docker containers, volumes, networks, and build caches
	@echo "🧹 Executing complete environment teardown..."
	$(COMPOSE) down -v --remove-orphans --rmi local 2>/dev/null || true
	rm -rf dist storybook-static playwright-report test-results *.log stats.html node_modules/.vite
	@echo "✅ Teardown complete. Environment fully reset."
