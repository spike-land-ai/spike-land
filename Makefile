# spike-land-ai — Bulk operations across all repos
#
# Usage:
#   make build-all     Build in dependency order (via yarn workspaces)
#   make test-all      Run all tests
#   make lint-all      Run all linters
#   make check-all     lint + test everything

SHELL := /bin/bash
# Updated usage header:
#   make test-changed      Run only tests for changed packages (vitest, fast)
#   make test-docker       Run changed package tests via Docker cache (skips unchanged)
#   make test-docker-all   Run ALL tests via Docker cache
ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

.PHONY: build-all test-all lint-all check-all status \
        build test test-watch test-coverage typecheck lint \
        dev health \
        rollback-worker rollback-spa rollback-spa-list \
        docker-setup docker-dev docker-ci docker-staging docker-prod \
        docker-down docker-ps docker-logs \
        test-docker test-docker-all test-changed

dev:
	yarn dev

health:
	@status=0; \
	echo "=== Workspace Health Check ==="; \
	echo "--- Typecheck ---"; \
	if yarn typecheck; then echo "PASS typecheck"; else echo "FAIL typecheck"; status=1; fi; \
	echo "--- Lint ---"; \
	if yarn lint:check; then echo "PASS lint"; else echo "FAIL lint"; status=1; fi; \
	echo "--- Format (changed files) ---"; \
	if yarn format:changed; then echo "PASS format"; else echo "FAIL format"; status=1; fi; \
	echo "--- Tests (changed) ---"; \
	if yarn test:src; then echo "PASS tests"; else echo "FAIL tests"; status=1; fi; \
	echo "=== Done ==="; \
	exit $$status

build-all:
	yarn workspaces foreach -Apt run build
	@echo "All repos built successfully"

test-all:
	yarn workspaces foreach -Ap run test
	@echo "All tests passed"

lint-all:
	yarn workspaces foreach -Ap run lint
	@echo "All lint checks passed"

check-all: lint-all test-all
	@echo "All checks passed"

# Short aliases
build: build-all
test: test-all
test-watch:
	yarn workspaces foreach -Ap run test:watch
test-coverage:
	yarn workspaces foreach -Ap run test:coverage
typecheck:
	yarn typecheck
lint: lint-all

rollback-worker:
	@test -n "$(WORKER)" || (echo "Usage: make rollback-worker WORKER=spike-edge" && exit 1)
	bash "$(ROOT)scripts/rollback.sh" worker "$(WORKER)"

rollback-spa-list:
	bash "$(ROOT)scripts/rollback.sh" spa list

rollback-spa:
	@test -n "$(SHA)" || (echo "Usage: make rollback-spa SHA=abc123" && exit 1)
	bash "$(ROOT)scripts/rollback.sh" spa "$(SHA)"

status:
	@for dir in $$(yarn workspaces list --json 2>/dev/null | node -e "\
		const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\n');\
		lines.forEach(l => { const w = JSON.parse(l); if (w.location !== '.') console.log(w.location); })"); do \
		if [ -d "$(ROOT)$$dir/.git" ]; then \
			branch=$$(cd "$(ROOT)$$dir" && git branch --show-current); \
			dirty=$$(cd "$(ROOT)$$dir" && git status --porcelain | head -1); \
			if [ -n "$$dirty" ]; then echo "$$dir ($$branch) — dirty"; \
			else echo "$$dir ($$branch) — clean"; fi; \
		fi; \
	done

# ─── Docker ──────────────────────────────────────────────────────────────────
COMPOSE_BASE := docker compose -f docker/docker-compose.yml

docker-setup:
	bash docker/scripts/setup-certs.sh
	bash docker/scripts/setup-dns.sh

docker-dev:
	$(COMPOSE_BASE) -f docker/docker-compose.dev.yml up -d

docker-ci:
	$(COMPOSE_BASE) -f docker/docker-compose.ci.yml up --abort-on-container-exit

docker-staging:
	$(COMPOSE_BASE) -f docker/docker-compose.staging.yml up -d

docker-prod:
	$(COMPOSE_BASE) -f docker/docker-compose.prod.yml up -d

docker-down:
	$(COMPOSE_BASE) down

docker-ps:
	$(COMPOSE_BASE) ps --format table

docker-logs:
	@test -n "$(SVC)" || (echo "Usage: make docker-logs SVC=spike-edge" && exit 1)
	$(COMPOSE_BASE) logs -f $(SVC)

# ─── Incremental test targets ────────────────────────────────────────────────
.PHONY: test-changed test-docker test-docker-all

test-changed:
	@bash scripts/test-changed.sh

test-docker:
	@DOCKER_BUILDKIT=1 bash scripts/docker-test.sh

test-docker-all:
	@DOCKER_BUILDKIT=1 bash scripts/docker-test.sh --all

setup:
	@echo "Checking prerequisites..."
	@node -v >/dev/null || (echo "✗ Node.js required — install via nvm" && exit 1)
	@node -e "if(+process.versions.node.split('.')[0]<24)process.exit(1)" || echo "⚠ Warning: Node 24+ recommended"
	@command -v mkcert >/dev/null || echo "⚠ mkcert not found — install: brew install mkcert nss (needed for yarn dev)"
	@command -v docker >/dev/null || echo "⚠ docker not found — needed for docker-based dev/test"
	@test -n "$$NODE_AUTH_TOKEN" || echo "⚠ NODE_AUTH_TOKEN not set — required for @spike-land-ai packages (see CONTRIBUTING.md)"
	@echo "Installing dependencies..."
	yarn install
	@echo "Setting up pre-commit hooks..."
	yarn prepare
	@echo "Copying .dev.vars examples..."
	@for f in packages/*/.dev.vars.example; do \
		dir=$$(dirname "$$f"); \
		[ ! -f "$$dir/.dev.vars" ] && cp "$$f" "$$dir/.dev.vars" && echo "Created $$dir/.dev.vars"; \
	done || true
	@echo ""
	@echo "Setup complete!"
	@echo "  Next: yarn dev (starts full local stack)"
	@echo "  See CONTRIBUTING.md for details"
