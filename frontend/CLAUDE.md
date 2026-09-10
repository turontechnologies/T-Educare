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
  mounted in the root layout — don't add a second theme provider. Dark mode
  is currently disabled (`defaultTheme="light"`, `enableSystem={false}` in
  `src/app/layout.tsx`) — the `.dark` CSS and `<ThemeToggle />`
  (`src/components/theme/theme-toggle.tsx`) still exist and work, just
  unmounted, ready to re-enable later.
- **Design fidelity**: the iEducare/TEduCare screenshots supplied for the
  login and dashboard pages are the authoritative visual spec, not
  inspiration — layout, proportions, colors, spacing, icon placement, and
  positioning must match them, not a "modernized" reinterpretation. This
  applies to every future page too: before building a new screen, match its
  spacing, typography, card/button/sidebar/header style to what's already in
  `src/app/login/` and `src/app/dashboard/` rather than introducing a new
  visual language. Literal placeholder _data_ in a mockup (fake names,
  repeated rows) doesn't need byte-for-byte reproduction — visual _design_
  does.
- **Brand tokens**: the iEducare brand colors (navy `primary`, blue
  `secondary`, gold `tertiary`) and body text color live as CSS custom
  properties in `src/app/globals.css` (`:root` / `.dark`), wired into Tailwind
  via the `@theme inline` block — the single source of truth for both. Never
  hardcode a brand hex (`#03045e`, `#1619ab`, `#fdc600`, `#333333`) in a
  component; use the semantic Tailwind classes (`bg-primary`,
  `text-secondary`, `bg-tertiary`, `text-tertiary-foreground`, etc.) so a
  token edit in one place repaints every consumer, in both themes, with no
  hunting through components. The brand SVGs/photo in `public/`
  (`ieducare-logo-navy.svg`, `ieducare-logo-white.svg`, `form-bg.svg` = tan
  doodle pattern, `auth-hero-illustration.svg` = footer illustration,
  `img.png` = hero photo) are likewise referenced only through `<Logo />`
  (`src/components/shared/logo.tsx`) and the auth feature components — reuse
  those rather than re-importing the raw asset paths elsewhere.
- **Motion**: `tw-animate-css` (already imported in `globals.css`) provides
  `animate-in`/`animate-out` + `fade-in`/`slide-in-from-*`/`zoom-in-*` +
  `delay-*`/`fill-mode-both` utilities — use these for entrance transitions
  instead of hand-rolled `@keyframes`. Project-specific motion
  (`animate-float-slow`, `animate-progress-indeterminate`, `animate-shimmer`)
  is defined once via Tailwind v4 `@utility` blocks at the bottom of
  `globals.css` — extend that set rather than inlining new `@keyframes` in a
  component file.

## Commands

```bash
pnpm dev         # start dev server
pnpm build       # production build
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm format      # prettier --write .
```
