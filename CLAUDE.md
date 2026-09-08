# CLAUDE.md

Guidance for Claude Code (and any other AI agent) working in this repository.

## Repository shape

T-Educare is a monorepo with two independent, separately-deployed apps:

- `frontend/` — Next.js (App Router) web app. Fully scaffolded, see [frontend/README.md](frontend/README.md) and [frontend/CLAUDE.md](frontend/CLAUDE.md).
- `backend/` — API service. Not yet scaffolded — stack is still to be decided. See [backend/README.md](backend/README.md).

There is no pnpm workspace linking the two — each has its own `package.json`,
lockfile, and `node_modules`, and is run with `pnpm --dir <app> <script>` or by
`cd`-ing into it directly. The root `package.json` only exists to host the git
hooks (Husky) and root-level `lint-staged` config shared across both apps.

## Conventions

- Package manager: **pnpm** everywhere (`pnpm@11`).
- Frontend stack: Next.js, TypeScript, Tailwind CSS v4, shadcn/ui (`base-nova`
  preset), Zustand, Zod, TanStack Query, React Hook Form, Axios. Details and
  file-by-file conventions are in [frontend/CLAUDE.md](frontend/CLAUDE.md).
- Formatting: Prettier (`semi: true`, double quotes, trailing commas). Run via
  `pnpm --dir frontend format` or let the pre-commit hook do it.
- Commits: pre-commit runs `lint-staged`, which lints/formats only staged
  files under `frontend/**`. Do not bypass with `--no-verify`.
- Do not add a pnpm workspace / shared `node_modules` unless explicitly asked
  — the two apps are meant to stay independently deployable.

## Common commands (from repo root)

```bash
pnpm dev:frontend      # next dev
pnpm build:frontend    # next build
pnpm lint:frontend     # eslint
pnpm format:frontend   # prettier --write
```

Or work directly inside `frontend/` with the usual `pnpm dev` / `pnpm build` /
`pnpm lint` / `pnpm typecheck`.

## Backend

`backend/` is intentionally empty pending a decision on stack (see its
README). When scaffolding it, mirror the pattern used for the frontend: keep
it a standalone app under `backend/`, add a `backend/CLAUDE.md` documenting
its conventions, and wire its lint/format commands into the root
`lint-staged` config the same way `frontend/**` is wired now.
