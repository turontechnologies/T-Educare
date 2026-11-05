# CLAUDE.md

Guidance for Claude Code (and any other AI agent) working in this repository.

## Repository shape

T-Educare is a monorepo with three independent, separately-deployed apps:

- `frontend/` — Next.js (App Router) web app for staff/admin and the platform
  super admin. See [frontend/README.md](frontend/README.md) and
  [frontend/CLAUDE.md](frontend/CLAUDE.md).
- `student/` — Next.js (App Router) Student Portal — a separate app/URL/port
  from `frontend/`, using the same backend API. Students log in with their
  matric number, never through `frontend/`'s staff/admin login. See
  [student/CLAUDE.md](student/CLAUDE.md).
- `backend/` — Java 21 / Spring Boot 3 API service (MSSQL via Docker, Flyway
  migrations, JWT auth). See [backend/README.md](backend/README.md) and
  [backend/CLAUDE.md](backend/CLAUDE.md).

There is no pnpm workspace linking `frontend/` and `student/` — each has its
own `package.json`, lockfile, and `node_modules`, and is run with
`pnpm --dir <app> <script>` or by `cd`-ing into it directly. The root
`package.json` only exists to host the git hooks (Husky) and root-level
`lint-staged` config shared across both frontend apps.

## Multi-tenancy: institution URL slugs

Every institution has a unique, URL-safe `slug` (e.g. `sams-university`),
auto-generated from its name at creation and editable by a super admin. It
drives that institution's own scoped sign-in URLs:

- Staff/admin: `frontend`'s `/login/{slug}`
- Students: `student`'s `/{slug}/login`

Both resolve branding (name, logo, optional brand color) via the
unauthenticated `GET /api/public/institutions/by-slug/{slug}` backend
endpoint, and both login flows pass the slug back to the backend
(`AuthService`/`StudentAuthService`), which rejects a login whose account
belongs to a *different* institution than the slug resolves to — even with
otherwise-correct credentials. A super admin manages an institution's slug,
brand color, and Portal Links (the two full sign-in URLs, ready to copy/send)
from `/super-admin/institutions`.

## Conventions

- Package manager: **pnpm** everywhere (`pnpm@11`).
- Frontend stack (both `frontend/` and `student/`): Next.js, TypeScript,
  Tailwind CSS v4, shadcn/ui (`base-nova` preset), Zustand, Zod, TanStack
  Query, React Hook Form, Axios. Details and file-by-file conventions are in
  each app's own CLAUDE.md.
- Backend stack: Java 21, Spring Boot 3, MSSQL (Docker), Flyway migrations,
  JWT auth. Details in [backend/CLAUDE.md](backend/CLAUDE.md).
- Formatting: Prettier (`semi: true`, double quotes, trailing commas). Run via
  `pnpm --dir <app> format` or let the pre-commit hook do it.
- Commits: pre-commit runs `lint-staged`, which lints/formats only staged
  files under `frontend/**` and `student/**`. Do not bypass with `--no-verify`.
- Do not add a pnpm workspace / shared `node_modules` unless explicitly asked
  — the apps are meant to stay independently deployable.

## Common commands (from repo root)

```bash
pnpm dev:frontend      # next dev   (admin app,   default port 3000)
pnpm build:frontend
pnpm lint:frontend
pnpm format:frontend

pnpm dev:student       # next dev   (student app, port 3001)
pnpm build:student
pnpm lint:student
pnpm format:student
```

Or work directly inside `frontend/`/`student/` with the usual `pnpm dev` /
`pnpm build` / `pnpm lint` / `pnpm typecheck`.

The backend runs via Docker Compose from `backend/`:
`docker compose build app && docker compose up -d app` (rebuild after any
code change — there's no hot reload in the container), exposed on port 8081.
