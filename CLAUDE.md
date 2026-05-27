# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Seasona (拾季) is a vertical e-commerce web application for agricultural products. It has three user roles (buyer, seller, admin) and an AI shopping assistant ("小拾"). The backend is FastAPI + SQLAlchemy + PostgreSQL; the frontend is Vue 3 + Vite.

## Common Commands

### Backend

```bash
# Install dependencies
python -m pip install -r requirements.txt        # production
python -m pip install -r requirements-dev.txt     # testing

# Run dev server (hot-reload)
uvicorn main:app --reload

# Run tests
python -m pytest                                   # unit + lightweight integration
python -m pytest -m unit                           # unit only
python -m pytest -m integration                    # PostgreSQL integration (needs SEASONA_TEST_DATABASE_URL)
python -m pytest --cov=app --cov-report=term-missing --cov-report=html

# Verify syntax / imports
python -m compileall app main.py
python -c "from main import app; print(len(app.openapi()['paths']))"
```

### Frontend

```bash
cd frontend/vite
npm install
npm run dev        # dev server at localhost:5173, proxies /api and /media to localhost:8000
npm run build      # output to frontend/dist/
```

### Docker (full stack)

```bash
docker compose up --build
```
Starts: api, postgres, redis, meilisearch, nginx.

## Architecture

### Backend (`app/`)

The FastAPI app is created via a factory in `app/main.py:create_app()`. All API routes live under `/api/v1/` with 13 routers registered in `app/api/v1/api.py`:

- `auth` - registration, login, password reset
- `products` - SPU/SKU CRUD
- `reviews` - product reviews and comments
- `search` - Meilisearch-backed product search
- `addresses`, `cart`, `orders`, `refunds` - buyer commerce flow
- `seller` - seller dashboard and order management
- `admin` - admin dashboard
- `ai` - AI shopping assistant (LLM intent + ingredient extraction)
- `uploads` - file uploads
- `health` - health check

Key layers:
- `app/models/` - SQLAlchemy ORM models (source of truth for schema)
- `app/schemas/` - Pydantic request/response validation
- `app/services/` - Business logic (auth, catalog, commerce, search, admin, ai)
- `app/core/` - Config (`config.py`), security/JWT (`security.py`), Redis client (`redis.py`), rate limiting, dependencies
- `app/db/` - Database session and Base model

Config is loaded from `.env` via a custom loader (not python-dotenv). All env vars are prefixed with `SEASONA_`. The `Settings` object is a cached singleton via `get_settings()`.

### Frontend (`frontend/vite/`)

Vue 3 SPA with Vue Router and Pinia state management. Key structure:

- `src/api/` - Axios modules (one per backend domain)
- `src/stores/` - Pinia stores: `auth`, `cart`, `search`
- `src/views/` - 25 page components for buyer, seller, admin, and AI flows
- `src/components/` - Shared UI components
- `src/router/index.js` - Route definitions with role-based guards (sellers redirected to `/seller`, admins to `/admin`)

### Database

PostgreSQL is the source of truth. No migration system (e.g., Alembic) is used; the schema is maintained as a DDL reference in `docs/schema.sql`. SQLAlchemy models in `app/models/` define the actual schema.

Key design patterns:
- Optimistic locking via `version` columns on `wallet_account` and `product_sku`
- `stock_locked` on SKU tracks reserved-but-unsettled inventory
- Order state machine: `wait_pay` → `paid` → `shipped` → `completed` / `cancelled` / `expired` / `refunded`
- Wallet flows use frozen/available balance split; internal freeze/thaw steps are hidden from user-facing transaction history

### Testing (`test/`)

Tests use pytest with markers: `unit`, `integration`, `api`, `slow`, `external`. Default run excludes `slow` and `external`.

- `test/unit/` - Fast, no DB/network. Covers schemas, tokens, password hashing, search/AI helpers.
- `test/integration/` - PostgreSQL-backed. Redis, Meilisearch, and LLM calls are monkeypatched or replaced with in-memory fakes.
- `test/conftest.py` - Fixtures for test settings, DB engine/session, and FastAPI TestClient with dependency overrides.
- `test/factories.py` - Test data factories using polyfactory.
- `test/final_acceptance_test.py` - Manual full-environment acceptance script (not part of CI).

Integration tests require `SEASONA_TEST_DATABASE_URL` pointing to a dedicated test database. The fixture drops and recreates the `public` schema, so never point it at a dev or production database.

### Concurrency Control

- SKU inventory and wallet balances use row-level locks (`SELECT ... FOR UPDATE`)
- Orders are locked before payment, cancellation, shipping, completion, refund, or dispute
- Wallet transactions have business unique constraints to prevent duplicate entries on idempotent retries
- Cart checkout idempotency keys are partitioned by buyer and merchant

### Search & AI

Meilisearch is the unified search index for product listings and AI ingredient matching. PostgreSQL is always the authoritative source; search results are candidates only -- actual orders re-validate against the database.

The AI assistant uses the OpenAI-compatible API (via `openai` SDK) for LLM intent confirmation and ingredient extraction.

## Environment Variables

All config is via `SEASONA_*` env vars. See `.env.example` for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `SEASONA_DATABASE_URL` | PostgreSQL connection string |
| `SEASONA_REDIS_URL` | Redis URL (token blacklist, rate limiting) |
| `SEASONA_MEILISEARCH_URL` | Meilisearch endpoint |
| `SEASONA_JWT_SECRET_KEY` | JWT signing secret |
| `SEASONA_LLM_API_KEY` / `SEASONA_LLM_BASE_URL` / `SEASONA_LLM_MODEL` | LLM config |
| `SEASONA_CORS_ORIGINS` | Comma-separated allowed origins |
| `SEASONA_TEST_DATABASE_URL` | Test-only PostgreSQL URL (used by pytest) |

## Admin Account Setup

Admin accounts cannot be registered via the API. Create one manually:

1. Generate a password hash: `python scripts/hash_password.py`
2. Insert the admin user directly into the database with the hashed password.
