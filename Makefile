# ==============================================================================
# FLOVA: Root Development Makefile
#
# Provides a simple, reliable, one-command development workflow for the entire
# FLOVA project (Frontend, AI STT Microservice, Backend tests & builds).
# ==============================================================================

.PHONY: all help dev frontend stt backend supabase tunnel dev-status stop \
        install install-frontend install-stt install-backend \
        test test-frontend test-backend test-stt build lint clean

# Default shell
SHELL := /bin/bash

# Project Paths
ROOT_DIR     := $(CURDIR)
FRONTEND_DIR := $(ROOT_DIR)/frontend
BACKEND_DIR  := $(ROOT_DIR)/backend
AI_DIR       := $(ROOT_DIR)/ai-engine

# Python Interpreter Detection:
# 1. ai-engine/.venv (service-specific virtual environment)
# 2. .venv (root-level virtual environment)
# 3. System python3 fallback
ifeq ($(wildcard $(AI_DIR)/.venv/bin/python),$(AI_DIR)/.venv/bin/python)
    PYTHON := $(AI_DIR)/.venv/bin/python
    PIP    := $(AI_DIR)/.venv/bin/pip
else ifeq ($(wildcard $(ROOT_DIR)/.venv/bin/python),$(ROOT_DIR)/.venv/bin/python)
    PYTHON := $(ROOT_DIR)/.venv/bin/python
    PIP    := $(ROOT_DIR)/.venv/bin/pip
else
    PYTHON := $(shell which python3 2>/dev/null || echo python3)
    PIP    := $(shell which pip3 2>/dev/null || echo pip)
endif

# Colors for terminal output
CLR_BOLD    := \033[1m
CLR_CYAN    := \033[36m
CLR_GREEN   := \033[32m
CLR_YELLOW  := \033[33m
CLR_MAGENTA := \033[35m
CLR_RESET   := \033[0m

# Default target
all: help

# ==============================================================================
# 1. HELP & USAGE
# ==============================================================================
help:
	@echo ""
	@echo -e "$(CLR_BOLD)FLOVA Development Control Center$(CLR_RESET)"
	@echo "========================================================================"
	@echo -e "Usage: $(CLR_CYAN)make [target]$(CLR_RESET)"
	@echo ""
	@echo -e "$(CLR_BOLD)Development Targets:$(CLR_RESET)"
	@echo -e "  $(CLR_GREEN)make dev$(CLR_RESET)            Start all required services + public HTTPS tunnel (Vite + STT + Tunnel)"
	@echo -e "  $(CLR_GREEN)make tunnel$(CLR_RESET)         Start only the public HTTPS tunnel for frontend (Cloudflare / localtunnel)"
	@echo -e "  $(CLR_GREEN)make frontend$(CLR_RESET)       Start only the React + Vite frontend (Port 5173)"
	@echo -e "  $(CLR_GREEN)make stt$(CLR_RESET)            Start only the IndicConformer STT service (Port 8001)"
	@echo -e "  $(CLR_GREEN)make backend$(CLR_RESET)        Inspect backend database status & run schema tests"
	@echo -e "  $(CLR_GREEN)make supabase$(CLR_RESET)       Start local Supabase (if configured locally)"
	@echo -e "  $(CLR_GREEN)make dev-status$(CLR_RESET)     Inspect status, ports, and health of local services"
	@echo -e "  $(CLR_GREEN)make stop$(CLR_RESET)           Cleanly terminate any running dev services on ports 5173/8001"
	@echo ""
	@echo -e "$(CLR_BOLD)Installation Targets:$(CLR_RESET)"
	@echo -e "  $(CLR_CYAN)make install$(CLR_RESET)        Install all dependencies (frontend, backend, and STT)"
	@echo -e "  $(CLR_CYAN)make install-frontend$(CLR_RESET) Install frontend npm packages"
	@echo -e "  $(CLR_CYAN)make install-stt$(CLR_RESET)     Create Python venv & install STT requirements"
	@echo -e "  $(CLR_CYAN)make install-backend$(CLR_RESET)  Install backend test dependencies"
	@echo ""
	@echo -e "$(CLR_BOLD)Testing & Verification Targets:$(CLR_RESET)"
	@echo -e "  $(CLR_MAGENTA)make test$(CLR_RESET)           Run all automated test suites (Frontend + Backend + AI)"
	@echo -e "  $(CLR_MAGENTA)make test-frontend$(CLR_RESET)  Run frontend services and financial engine tests"
	@echo -e "  $(CLR_MAGENTA)make test-backend$(CLR_RESET)   Run database schema RLS and demo seed tests"
	@echo -e "  $(CLR_MAGENTA)make test-stt$(CLR_RESET)       Run Python IndicConformer and engine unit tests"
	@echo -e "  $(CLR_MAGENTA)make build$(CLR_RESET)          Compile production frontend bundle (tsc + vite build)"
	@echo -e "  $(CLR_MAGENTA)make lint$(CLR_RESET)           Run TypeScript type checking across frontend"
	@echo ""
	@echo -e "$(CLR_BOLD)Maintenance Targets:$(CLR_RESET)"
	@echo -e "  $(CLR_YELLOW)make clean$(CLR_RESET)          Remove temporary build artifacts and test caches"
	@echo "========================================================================"
	@echo ""

# ==============================================================================
# 2. DEVELOPMENT WORKFLOWS
# ==============================================================================

# Start all development services concurrently with process supervision and public tunnel
dev:
	@$(PYTHON) $(ROOT_DIR)/scripts/dev-runner.py $(if $(filter 0,$(TUNNEL)),--no-tunnel,--tunnel)

# Start only the public HTTPS tunnel forwarder for the Vite frontend
tunnel:
	@$(PYTHON) $(ROOT_DIR)/scripts/dev-runner.py --tunnel-only

# Start only the React + Vite frontend
frontend:
	@echo -e "$(CLR_CYAN)[frontend] Starting Vite development server on http://localhost:5173...$(CLR_RESET)"
	@cd $(FRONTEND_DIR) && npm run dev

# Start only the IndicConformer STT FastAPI microservice
stt:
	@echo -e "$(CLR_GREEN)[stt] Starting AI4Bharat IndicConformer STT on http://localhost:8001...$(CLR_RESET)"
	@cd $(AI_DIR) && PYTHONPATH=$(AI_DIR) $(PYTHON) -m uvicorn stt_service.main:app --host 0.0.0.0 --port 8001

# Inspect backend status and execute database contract verification
backend:
	@echo -e "$(CLR_MAGENTA)[backend] FLOVA backend uses hosted Supabase (msjzkylvafuwlkkujxpv).$(CLR_RESET)"
	@echo -e "$(CLR_MAGENTA)[backend] Running database migration and Row Level Security validation...$(CLR_RESET)"
	@cd $(BACKEND_DIR) && npm run test:db

# Start local Supabase only if configured locally
supabase:
	@if command -v supabase >/dev/null 2>&1; then \
		echo -e "$(CLR_CYAN)[supabase] Starting local Supabase instance...$(CLR_RESET)"; \
		cd $(BACKEND_DIR) && supabase start; \
	elif [ -d "$(BACKEND_DIR)/node_modules/.bin" ] && [ -f "$(BACKEND_DIR)/node_modules/.bin/supabase" ]; then \
		echo -e "$(CLR_CYAN)[supabase] Starting local Supabase via npx...$(CLR_RESET)"; \
		cd $(BACKEND_DIR) && npx supabase start; \
	else \
		echo -e "$(CLR_YELLOW)[supabase] Notice: Local Supabase CLI is not installed.$(CLR_RESET)"; \
		echo "  FLOVA is configured to use cloud-hosted Supabase:"; \
		echo "  Project Gateway : https://msjzkylvafuwlkkujxpv.supabase.co"; \
		echo "  Edge Functions  : process-voice, extract-receipt (deployed)"; \
		echo ""; \
		echo "  To use local Supabase, install the Supabase CLI:"; \
		echo "  See https://supabase.com/docs/guides/cli"; \
	fi

# Check status and ports of all development services
dev-status:
	@$(PYTHON) $(ROOT_DIR)/scripts/dev-runner.py --status

# Stop any running processes holding the development ports
stop:
	@$(PYTHON) $(ROOT_DIR)/scripts/dev-runner.py --stop

# ==============================================================================
# 3. INSTALLATION
# ==============================================================================

install: install-frontend install-stt install-backend
	@echo ""
	@echo -e "$(CLR_BOLD)$(CLR_GREEN)✓ All FLOVA dependencies installed successfully!$(CLR_RESET)"
	@echo "Run 'make dev' to start the local development environment."
	@echo ""

install-frontend:
	@echo -e "$(CLR_CYAN)[install] Installing frontend dependencies...$(CLR_RESET)"
	@cd $(FRONTEND_DIR) && npm install

install-stt:
	@echo -e "$(CLR_GREEN)[install] Setting up Python environment for IndicConformer STT...$(CLR_RESET)"
	@if [ ! -d "$(AI_DIR)/.venv" ]; then \
		echo "  Creating virtual environment at $(AI_DIR)/.venv..."; \
		python3 -m venv "$(AI_DIR)/.venv"; \
	fi
	@if command -v uv >/dev/null 2>&1; then \
		echo "  Installing STT requirements via uv (fast mode)..."; \
		uv pip install --python "$(AI_DIR)/.venv/bin/python" -r "$(AI_DIR)/stt_service/requirements.txt"; \
	else \
		echo "  Installing STT requirements via pip..."; \
		"$(AI_DIR)/.venv/bin/pip" install --upgrade pip; \
		"$(AI_DIR)/.venv/bin/pip" install -r "$(AI_DIR)/stt_service/requirements.txt"; \
	fi
	@echo -e "$(CLR_GREEN)[install] STT dependencies installed in $(AI_DIR)/.venv.$(CLR_RESET)"

install-backend:
	@echo -e "$(CLR_MAGENTA)[install] Installing backend test dependencies...$(CLR_RESET)"
	@cd $(BACKEND_DIR) && npm install

# ==============================================================================
# 4. TESTING, LINTING & BUILDING
# ==============================================================================

# Run all test suites
test: test-frontend test-backend test-stt
	@echo ""
	@echo -e "$(CLR_BOLD)$(CLR_GREEN)✓ ALL FLOVA AUTOMATED TESTS PASSED!$(CLR_RESET)"
	@echo ""

test-frontend:
	@echo -e "$(CLR_CYAN)[test-frontend] Running services, voice intent, and smart capture suites...$(CLR_RESET)"
	@cd $(FRONTEND_DIR) && node --loader ./src/services/__tests__/mockLoader.mjs --test "src/services/__tests__/*.test.ts"
	@echo -e "$(CLR_CYAN)[test-frontend] Running financial engine, runway, WISH, and profile suites...$(CLR_RESET)"
	@cd $(FRONTEND_DIR) && node --loader ./src/services/__tests__/mockLoader.mjs --test \
		"src/engine/__tests__/*.test.ts" \
		"src/runway/__tests__/*.test.ts" \
		"src/wish/__tests__/*.test.ts" \
		"src/profile/__tests__/*.test.ts" \
		"src/data/__tests__/*.test.ts"

test-backend:
	@echo -e "$(CLR_MAGENTA)[test-backend] Running Supabase schema, triggers & RLS tests (54 tests)...$(CLR_RESET)"
	@cd $(BACKEND_DIR) && npm run test:db
	@echo -e "$(CLR_MAGENTA)[test-backend] Running demo data seeding & isolation tests (17 tests)...$(CLR_RESET)"
	@cd $(BACKEND_DIR) && npm run test:seed

test-stt:
	@echo -e "$(CLR_GREEN)[test-stt] Running Python STT service & udaan engine tests...$(CLR_RESET)"
	@cd $(AI_DIR) && PYTHONPATH=$(AI_DIR) $(PYTHON) -m pytest

# Compile production bundle
build:
	@echo -e "$(CLR_CYAN)[build] Compiling production frontend bundle...$(CLR_RESET)"
	@cd $(FRONTEND_DIR) && npm run build

# TypeScript type check
lint:
	@echo -e "$(CLR_CYAN)[lint] Running TypeScript type verification (tsc -b)...$(CLR_RESET)"
	@cd $(FRONTEND_DIR) && npx tsc -b

# ==============================================================================
# 5. MAINTENANCE
# ==============================================================================

clean:
	@echo -e "$(CLR_YELLOW)[clean] Removing temporary build artifacts and test caches...$(CLR_RESET)"
	@rm -rf $(FRONTEND_DIR)/dist
	@rm -rf $(AI_DIR)/.pytest_cache
	@find $(AI_DIR) -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find $(ROOT_DIR)/scripts -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo -e "$(CLR_GREEN)✓ Safe temporary files cleaned.$(CLR_RESET)"
