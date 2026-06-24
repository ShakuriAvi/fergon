Project Overview
Build a complete Hebrew (RTL) web app UI for "פרגון" (fergon) — a generic peer-to-peer recognition platform for any organization (schools, companies, restaurants, etc.). Each organization defines its own roles, recognition values, and monthly point allowances. Israel's education system (teachers, principals, counselors, coordinators) is the first/primary example deployment, but the data model (organizations, roles) is organization-agnostic.


# Tech Stack
Frontend: React (Vite)
Backend: Python (FastAPI) + SQLAlchemy ORM
Database: MySQL in Docker (local POC)
Infrastructure: Docker Compose for local dev
Coding Conventions

# Git / Version Control (STRICT)
NEVER COMMIT. Do not run `git commit` (or `git push`, `git merge`, or any history-changing git command) under ANY circumstances — not even when executing a GitHub issue. Leave all changes in the working tree for me to review and commit myself. The only git commands you may run are read-only ones (e.g. `git status`, `git diff`, `git log`). If a workflow step below says to commit, ignore that step.

# Backend (Python / FastAPI)
View & Service architecture: Routes (views) handle HTTP request/response, auth, and validation only.
All business logic lives in services/. Never put DB queries or business logic directly in route handlers — delegate to a service function.

SYNCHRONOUS CODE ONLY (STRICT): All backend code must be synchronous. Use plain `def` everywhere — never `async def`, `await`, `asyncio`, or `starlette.concurrency.run_in_threadpool`. This applies to routes/endpoints, services, the DB layer, and all helper functions. Sync endpoints are already run in a threadpool by FastAPI, so blocking work is fine.
  - The ONLY permitted `async def` is a Starlette middleware `dispatch` method, because the ASGI/Starlette contract requires it. Even there, keep ALL business and DB logic in synchronous helper functions and call them directly (no `await`, no `run_in_threadpool`); `dispatch` may only `await call_next(request)`.
  - Do not introduce `async` to "fix" a blocking call. If you think you need `async`/`await`/`run_in_threadpool`, you don't — write it sync.

Configuration: `app/core/config.py` exposes a single `Settings` instance as a singleton, built exactly once at app setup via `init_settings()` (called in `create_app`). Access it through `get_settings()`; never construct `Settings()` per request or per call. Use `reset_settings()` only in tests.
All models inherit from a shared Base declarative base.
Use Pydantic schemas for request/response validation.
Environment variables loaded via pydantic-settings or python-dotenv.
Create middleware that checks for appropriate permissions for each endpoint. (We have four different users in the system - admin, principal, teacher, secretary).
All the user action store in the action log table for tracking after action the user did.
Use in alembic for sync the db changes between dev to the prod.
All the code is written in English, create an additional file (json) that translates from English to Hebrew the parts that we want to be returned in Hebrew to the frontend.
Create DB layer for manage all quries in one place. Use in Context Manager Pattern for manage the connection to db.
For any changes add / delete / edit unit test.

Soft delete (STRICT): NEVER hard-delete rows. Every "delete" action is a soft delete that sets `is_active = 0`. Any model that can be deleted must expose an `is_active` boolean column (server default `1`); add the column + an Alembic migration if it does not have one yet. List/read queries exclude inactive rows by default (offer an explicit `include_inactive` option where needed), and a corresponding reactivation path (`is_active = 1`) should be supported.

# Frontend (React)
Functional components with hooks only.
All UI text via i18n keys — never hardcode Hebrew in JSX.
Use react-i18next with locales/he.json as source of truth.
Logging Strategy
Add unit test for any changes.

# Frontend constants (STRICT)
No repeated/"magic" string literals inline in components. Every main folder
under `src/` (`components`, `lib`, `hooks`, …) owns a `constants.js` that holds
the repeated string literals used in that folder — i18n translation *keys* (the
key only; the Hebrew copy stays in `locales/he.json`), view/route identifiers,
API resource names/paths, HTTP verbs, header names, and storage/cookie keys.
Import these constants instead of retyping the literal. App-wide constants live
in `src/constants.js`. This applies to BOTH `frontend/` (web) and
`frontend-native/` (native). Tailwind/StyleSheet class strings are the only
exception — they are presentation tokens and stay inline. A guard test
(`src/constants.test.js` web / `src/lib/constants.guard.test.js` native) fails
if a centralized literal reappears raw in source; keep it green.

# CI (STRICT)
GitHub Actions (`.github/workflows/ci.yml`) runs backend `pytest`, web `vitest`,
and native `jest` on every push and pull request. All three jobs must pass —
never merge or push changes that break the pipeline, and add/adjust tests so the
suite stays green.

# Backend Logging
Use Python's built-in logging module with structured JSON format.
Log every user action: OTP request, OTP verify, book, modify, cancel, login, availability change.
Log levels:
INFO — successful user actions (booked appointment, verified OTP, updated availability).
WARNING — failed OTP attempts, invalid requests, slot conflicts.
ERROR — unhandled exceptions, DB connection failures, messaging API errors.
DEBUG — request/response details (local dev only).
FastAPI middleware logs every incoming request: method, path, status code, duration, user identifier (phone).
Log format: {timestamp} | {level} | {action} | {user_phone} | {business_slug} | {details}

## Workflow: Requirements → GitHub Issues

When I describe a new requirement or feature:
1. DO NOT start implementing immediately
2. Create a GitHub Issue with:
   - Clear title
   - Description of the requirement
   - Acceptance criteria (checklist)
   - Labels: `pending-approval`
3. Reply with the issue URL and wait for my approval

When I say "execute issue #N":
1. Fetch the issue content from GitHub
2. Implement it according to the acceptance criteria
3. DO NOT commit. Leave all changes in the working tree for me to review and commit myself (see Git / Version Control rule above).
4. Reply with a summary of what changed and which acceptance criteria are met. Do not close the issue or open a PR unless I explicitly ask.
