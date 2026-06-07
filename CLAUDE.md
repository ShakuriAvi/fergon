Project Overview
Build a complete Hebrew (RTL) web app UI for "פרגון" (fergon) — a peer-to-peer recognition platform for Israel's education system (teachers, principals, counselors, coordinators).


# Tech Stack
Frontend: React (Vite)
Backend: Python (FastAPI) + SQLAlchemy ORM
Database: MySQL in Docker (local POC)
Infrastructure: Docker Compose for local dev
Coding Conventions

# Backend (Python / FastAPI)
View & Service architecture: Routes (views) handle HTTP request/response, auth, and validation only. 
All business logic lives in services/. Never put DB queries or business logic directly in route handlers — delegate to a service function.
Use sync endpoints (def). (not async)
All models inherit from a shared Base declarative base.
Use Pydantic schemas for request/response validation.
Environment variables loaded via pydantic-settings or python-dotenv.
Create middleware that checks for appropriate permissions for each endpoint. (We have four different users in the system - admin, principal, teacher, secretary).
All the user action store in the action log table for tracking after action the user did.
Use in alembic for sync the db changes between dev to the prod.
All the code is written in English, create an additional file (json) that translates from English to Hebrew the parts that we want to be returned in Hebrew to the frontend.
Create DB layer for manage all quries in one place. Use in Context Manager Pattern for manage the connection to db.
For any changes add / delete / edit unit test.

# Frontend (React)
Functional components with hooks only.
All UI text via i18n keys — never hardcode Hebrew in JSX.
Use react-i18next with locales/he.json as source of truth.
Logging Strategy
Add unit test for any changes.

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
3. Commit with message referencing the issue: `feat: <title> (closes #N)`
4. Mark the issue as closed via PR or directly



