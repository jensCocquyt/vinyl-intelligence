# vinyl-intelligence

## Stack

- **Frontend**: Angular 21, standalone components, signals, `@clerk/clerk-js` v6, Chart.js
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, `@clerk/express` v2
- **DB**: PostgreSQL
- **Auth**: Clerk
- **Package manager**: pnpm workspaces

## Code conventions

### Backend

- Always use `import type` for Express types (`Request`, `Response`, `NextFunction`) — enforced by ESLint `@typescript-eslint/consistent-type-imports`
- Middleware functions go in `backend/src/middleware/`
- All API routes are scoped under `/api`; the `/health` endpoint lives at root
- Auth is enforced via `requireAuth` middleware from `backend/src/middleware/auth.ts`

### Frontend

- Use `@if` / `@for` control flow syntax (Angular 17+), not `*ngIf` / `*ngFor`
- No typed lambdas in templates — use component methods instead
- Environment values are baked at build time via `import.meta.env` with `NG_APP_*` prefix

## Code review style

Perform a thorough senior/staff-engineer-level review. Use [conventional comments](https://conventionalcomments.org/) prefixes (`suggestion:`, `issue:`, `nitpick:`, `question:`, `praise:`, `thought:`) on every comment.

## What to flag in reviews

- Missing `import type` on Express type imports
- Auth middleware (`requireAuth`) missing on routes that access user data
- CORS changes that could expose the API to unintended origins
- Env vars hardcoded in source instead of read from `process.env` / `import.meta.env`
- DB queries outside of service files (routes should delegate to services)
- ESLint errors introduced by the PR — the lint script runs with so any warning will fail CI
