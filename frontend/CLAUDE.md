@AGENTS.md

# T-Educare frontend

Next.js App Router app. Package manager is **pnpm**. See the repo root
[CLAUDE.md](../CLAUDE.md) for the monorepo layout.

## Stack

TypeScript, Tailwind CSS v4, shadcn/ui (`base-nova` preset, `base-ui` under
the hood — not Radix), Zustand, Zod, TanStack Query, React Hook Form, Axios,
next-themes, sonner.

## Conventions

- **Path alias**: `@/*` → `src/*`.
- **`cn()`**: from the `cn` package (re-exported at `src/lib/utils.ts`) —
  shadcn's own clsx + tailwind-merge replacement. Don't add `clsx` or
  `tailwind-merge` directly.
- **UI primitives** (`src/components/ui/`): shadcn-generated, edit in place
  when a component needs a project-specific tweak rather than wrapping it.
  Add more with `pnpm dlx shadcn@latest add <component>`.
- **Feature components** go in `src/components/features/<feature>/`; shared
  cross-feature UI in `src/components/shared/`; route shells (headers, nav,
  sidebars) in `src/components/layouts/`.
- **Data fetching**: one `*.service.ts` per domain in `src/services/`, each a
  plain object of async functions calling `apiClient` from `src/lib/axios.ts`.
  Wrap them in TanStack Query hooks under `src/hooks/` (see
  `src/hooks/use-login.ts`) — don't call services directly from components.
- **Client state**: one Zustand store per domain in `src/store/` (see
  `src/store/auth.store.ts`). Only put state here that needs to survive
  across routes/components — prefer local `useState` otherwise. Persisted
  stores use `zustand/middleware`'s `persist`.
- **Validation**: one Zod schema file per domain in `src/lib/validations/`,
  paired with an inferred `*FormValues` type, consumed by
  `react-hook-form` + `@hookform/resolvers/zod`.
- **Auth**: `useAuthStore` holds the bearer token; `src/lib/axios.ts`
  attaches it to every request and force-logs-out on a 401 (except from the
  login call itself).
- **Toasts**: `sonner`'s `toast()`, rendered via the `<Toaster />` mounted
  once in `src/app/layout.tsx`.
- **Theming**: `next-themes` `ThemeProvider` (`attribute="class"`), also
  mounted in the root layout — don't add a second theme provider.

## Commands

```bash
pnpm dev         # start dev server
pnpm build       # production build
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm format      # prettier --write .
```
