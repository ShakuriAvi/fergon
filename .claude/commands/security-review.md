---
description: Run a comprehensive security review on changed or specified files. Checks for data leaks, injection vulnerabilities, secrets exposure, auth issues, and more.
---

# Security Review Command

You are a senior security engineer performing a thorough security audit. Analyze the code changes (or the files/directories provided via `$ARGUMENTS`, defaulting to the current changeset if none specified) and produce a structured security report.

**IMPORTANT**: Be thorough. Do not skip any check. For each category, explicitly state PASS or FAIL with evidence (file paths, line numbers, code snippets).

---

## 1. Sensitive Data Exposure to Client

Scan all HTTP responses, API routes, GraphQL resolvers, and server actions:

- **Over-fetching from DB**: Are full database records being sent to the client when only specific fields are needed? Look for `SELECT *`, full ORM object serialization, or returning entire models without a DTO/view-model.
- **Leaking internal IDs**: Are internal auto-increment IDs, UUIDs of other users, or internal entity references exposed in API responses when not necessary?
- **Stack traces & debug info**: Ensure error responses don't leak stack traces, internal file paths, DB schema details, or framework version info in production mode.
- **Sensitive fields in responses**: Check that fields like `password`, `passwordHash`, `salt`, `ssn`, `creditCard`, `token`, `refreshToken`, `secret`, `internalNotes`, or similar are NEVER included in HTTP responses to the client.
- **Logs leaking to client**: Ensure `console.log` or debug statements don't accidentally expose sensitive data that reaches the client bundle.

## 2. SQL Injection & Query Safety

- **Raw queries**: Flag any raw SQL string concatenation or template literal interpolation with user input (e.g., `` `SELECT * FROM users WHERE id = ${userId}` ``).
- **ORM misuse**: Check for unsafe usage even with ORMs — e.g., Sequelize `literal()`, TypeORM `query()`, Prisma `$queryRawUnsafe()`, Knex `.whereRaw()` with unparameterized values.
- **Stored procedures**: If calling stored procedures, ensure parameters are properly bound.
- **NoSQL injection**: For MongoDB/similar, check for unsanitized `$where`, `$regex`, or object injection in query filters (e.g., passing `{ "$gt": "" }` as a filter value).

## 3. Secrets & Tokens in Client-Side Code

Scan ALL frontend/client-side code (anything in `src/`, `app/`, `pages/`, `components/`, `public/`, or any client bundle):

- **Hardcoded secrets**: API keys, tokens, passwords, connection strings, private keys, or signing secrets must NEVER appear in client code.
- **Environment variable misuse**: In Next.js, only `NEXT_PUBLIC_*` vars are exposed to the client — ensure no server-only secrets use this prefix. In Vite, check `VITE_*`. In CRA, check `REACT_APP_*`. Verify that the exposed variables contain ONLY public, non-sensitive values.
- **Token storage**: If JWTs or session tokens are stored client-side, verify they use `httpOnly` + `secure` + `sameSite` cookies — NOT `localStorage` or `sessionStorage`.
- **Source maps**: Ensure production builds don't ship source maps that could expose backend logic.

## 4. Environment Variables & Configuration

- **Hardcoded values**: Scan the entire codebase for hardcoded connection strings, API keys, passwords, webhook URLs, or signing secrets. ALL must be in `.env` files or a secret manager.
- **`.env` in version control**: Verify `.env` (and `.env.local`, `.env.production`, etc.) are listed in `.gitignore`. Flag if any `.env` file is committed.
- **Missing `.env.example`**: If `.env` is used, an `.env.example` should exist with placeholder values and comments (never real secrets).
- **Default fallbacks**: Check for patterns like `process.env.SECRET || "default-secret"` — these hardcoded fallbacks defeat the purpose of env vars.

## 5. Cross-User Data Leakage & Authorization

This is critical — verify strict data isolation:

- **Missing ownership checks**: Every data-access endpoint (read, update, delete) must verify the requesting user owns or is authorized to access the resource. Look for endpoints that only check authentication but not authorization (e.g., `GET /api/orders/:id` without verifying the order belongs to the user).
- **IDOR (Insecure Direct Object Reference)**: Can a user access another user's data by changing an ID in the URL or request body? Flag any endpoint where the resource ID comes from user input without an ownership check.
- **Tenant isolation**: In multi-tenant apps, ensure queries always filter by tenant/organization ID and that tenant context cannot be spoofed.
- **List endpoints**: Ensure list/index endpoints filter by the current user's scope and don't return all records.
- **Shared caches**: If caching is used (Redis, in-memory), ensure cache keys are scoped to the user/tenant to prevent cross-user data leaks.

## 6. Database Usage & Schema Safety

- **Migrations**: Are schema changes done via proper migrations (not raw ALTER TABLE in app code)?
- **Permissions**: Does the app DB user have minimum necessary privileges? (It should NOT have DROP, GRANT, or superuser access.)
- **Sensitive data storage**: Are passwords hashed with bcrypt/argon2 (NOT md5/sha1/plain text)? Are credit card numbers, SSNs stored encrypted at rest?
- **Cascading deletes**: Are foreign key constraints and cascade rules correct? Could deleting one record accidentally wipe related data?
- **Indexes on auth columns**: Are columns used for lookups (email, username, session_id) properly indexed?

## 7. Authentication & Session Management

- **Password handling**: Passwords must be hashed server-side using bcrypt, scrypt, or argon2 with appropriate cost factors. Never hash client-side only.
- **Session expiration**: Sessions/tokens must have reasonable expiration. Check for tokens with no expiry or extremely long lifetimes (> 24h for access tokens).
- **CSRF protection**: State-changing endpoints (POST/PUT/DELETE) must have CSRF protection (tokens, SameSite cookies, or origin checks).
- **Rate limiting**: Login, registration, password reset, and OTP endpoints must have rate limiting to prevent brute force.
- **Password reset flow**: Reset tokens must be single-use, time-limited, and invalidated after use.

## 8. Input Validation & Sanitization

- **XSS (Cross-Site Scripting)**: Is user input sanitized before rendering in HTML? Check for `dangerouslySetInnerHTML`, `v-html`, `innerHTML`, `{!! !!}` (Blade), or any raw HTML rendering of user input.
- **Request validation**: Are request bodies, query params, and URL params validated with a schema (Zod, Joi, class-validator, etc.) before use?
- **File uploads**: If file uploads exist — are file types validated server-side (not just by extension)? Are file sizes limited? Are files stored outside the webroot?
- **Redirect validation**: Open redirect vulnerabilities — are redirect URLs validated against an allowlist?

## 9. API Security

- **Rate limiting**: Are public-facing endpoints rate-limited?
- **CORS configuration**: Is CORS configured with specific origins (not `*` in production)?
- **HTTP security headers**: Check for `Helmet` or equivalent: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`.
- **API versioning**: Are deprecated/insecure API versions still accessible?
- **GraphQL specifics**: If using GraphQL — is introspection disabled in production? Is query depth/complexity limited?

## 10. Dependency & Supply Chain Security

- **Known vulnerabilities**: Are there outdated dependencies with known CVEs? (Reference `npm audit` / `yarn audit` / `pip audit` results if available.)
- **Lock file integrity**: Is `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` committed and consistent?
- **Suspicious packages**: Flag any dependency with very low download counts, recent ownership transfers, or typosquat names.

## 11. Logging & Error Handling

- **Sensitive data in logs**: Ensure passwords, tokens, credit card numbers, PII are NEVER logged, even at debug level.
- **Consistent error responses**: API errors should return generic messages to clients ("Something went wrong") while logging details server-side.
- **Unhandled exceptions**: Are there proper global error handlers? Unhandled promise rejections or uncaught exceptions should not crash the server or leak info.

## 12. Infrastructure & Deployment

- **HTTPS enforcement**: Is HTTP-to-HTTPS redirect configured?
- **Debug mode**: Ensure debug/development modes are disabled in production configs.
- **Admin endpoints**: Are admin routes protected and not publicly accessible?
- **Docker security**: If using Docker — is the app running as non-root? Are secrets passed via env/secrets, not baked into the image?

---

## Output Format

Produce the report as follows:

```
## Security Review Report

**Scope**: [files/directories reviewed]
**Date**: [current date]
**Severity Summary**: 🔴 Critical: X | 🟠 High: X | 🟡 Medium: X | 🔵 Low: X | ✅ Passed: X

### Critical & High Findings

[For each finding:]
#### [SEVERITY] [Category] — [Short title]
- **File**: `path/to/file.ts:lineNumber`
- **Issue**: [Clear description of the vulnerability]
- **Evidence**: [Relevant code snippet]
- **Fix**: [Specific remediation steps with code example]

### Medium & Low Findings
[Same format, grouped]

### Passed Checks
[List categories that passed with brief justification]

### Recommendations
[Prioritized action items]
```

**Severity guide**:
- 🔴 **Critical**: Actively exploitable, immediate data breach risk (e.g., SQL injection, exposed secrets, no auth on sensitive endpoint)
- 🟠 **High**: Exploitable with some effort, significant impact (e.g., IDOR, missing rate limiting on auth, XSS)
- 🟡 **Medium**: Defense-in-depth issues, moderate impact (e.g., missing security headers, overly permissive CORS, no input validation)
- 🔵 **Low**: Best practice gaps, minimal immediate risk (e.g., missing `.env.example`, no lock file, verbose error messages in staging)