@AGENTS.md

# T-Educare frontend

Next.js App Router app. Package manager is **pnpm**. See the repo root
[CLAUDE.md](../CLAUDE.md) for the monorepo layout.

**Deployed** to Vercel at https://t-educare.vercel.app/, in addition to
local dev at `http://localhost:3000`. Once `backend/` exists, it needs CORS
open to both origins (see `backend/API_CONTRACT.md` § Deployment) —
`NEXT_PUBLIC_API_URL` gets set per-environment (local `.env` vs. the Vercel
project's env vars) to point at wherever that backend is deployed.

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
- **The sidebar is locked.** `<SidebarContent>` (`src/components/layouts/app-sidebar.tsx`)
  was corrected against an explicit Figma reference and must not be
  restyled again without a new reference screenshot from the user — this
  has already happened once (colors/icons were "redesigned" during an
  unrelated scroll-bug fix and had to be reverted). The rules, as given:
  nav icons are **always** gold (`text-tertiary`), regardless of
  active/inactive state — only the label text and group chevron change
  color; a collapsed group's chevron points right (`ChevronRight`) and
  rotates 90° to point down when expanded; the brand header band is gold
  with **white** logo + text (`variant="light"` on `<Logo>`), not navy; a
  dashed `border-secondary` divider separates the nav list from Logout, not
  a solid one. If a future change to this component is unavoidable (e.g. a
  genuine bug fix), touch only what the fix requires — layout/overflow
  classes, not color or iconography — and call out explicitly in your
  response that you touched it and why.
- **Admin tables must stay identical to each other.** Institutions
  (`src/app/super-admin/institutions/page.tsx`) and User Manager
  (`src/app/super-admin/user-manager/page.tsx`) are the reference — same
  Card/CardHeader (Show-entries + Search, `flex flex-wrap items-center
justify-between gap-4` — not `flex-row`, which doesn't override
  `CardHeader`'s default `grid` and silently stacks the two instead of
  placing them on one row), same row entrance animation
  (`animate-in fade-in duration-300` per `<TableRow>`), same Action column: a
  single kebab (`MoreHorizontal`) button opening a `DropdownMenu` — never
  separate icon buttons and never an inline `Switch` for status. Item order
  is always Edit → resource-specific actions (e.g. Activate/Deactivate) →
  separator → destructive Delete. Every activate/deactivate/delete is
  confirmed via `<ConfirmDialog>` first, and delete always archives
  (soft-delete, restorable via the "View archived" toggle) — never a hard
  delete. Build every new admin list this exact way; if the pattern needs to
  change, change it in both tables at once, not one at a time.
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

- **Roles & areas**: two authenticated areas, gated by `AuthenticatedUser.role`
  in `src/types/auth.ts` — `super_admin` (`src/app/super-admin/`, platform
  owner) and `institution_admin` (`src/app/dashboard/`, one institution).
  Both share the `<AppSidebar>`/`<AppHeader>` shell
  (`src/components/layouts/`); each area's `layout.tsx` picks the nav tree
  and redirects a logged-in user of the wrong role to their own area.
- **Menus are data, not JSX**: `src/config/nav.ts` (`INSTITUTION_NAV`,
  `SUPER_ADMIN_NAV`) is the single source of truth for every sidebar entry —
  label, href, icon, nested children. Add a new page's nav entry there, not
  inline in a sidebar component, and give it a stable `key` (RBAC roles
  reference these keys — never reuse or rename one already referenced by a
  `Role.menuKeys`).
- **RBAC**: `src/store/rbac.store.ts` holds custom `Role`s (name + which
  `nav.ts` keys they grant, via `menuKeys`) and `ManagedUser`s (staff, each
  assigned a `roleId`), persisted client-side. The institution's root admin
  uses the seeded system role (`ROOT_ADMIN_ROLE_ID`, unrestricted); every
  other institution user goes through `/dashboard/user-management` — create a
  `Role` with the menu items it should see, then assign staff to it.
  `filterNavByAccess()` (`src/config/nav.ts`) turns a role's `menuKeys` into
  the actual filtered tree a given user's sidebar renders — this is computed
  reactively in `dashboard/layout.tsx` from the live store, so an edit to a
  role takes effect immediately (next login re-resolves `roleId` too, see
  `authService.login`). Never gate a page's _content_ by role inline; gate it
  by not putting it in the user's menu, and if a page needs real protection
  beyond "not linked," add the check where the other layout role-redirects
  live.
- **RBAC has a second, module-gating layer above roles**: a `NavItem` in
  `nav.ts` can carry an optional `moduleKey` (one of the keys in
  `src/config/modules.ts`), and `filterNavByModules()` filters a nav tree
  down to only items whose `moduleKey` is in the current institution's
  `Institution.moduleKeys` (set by a super admin on `/super-admin/modules` —
  see `institution-modules-dialog.tsx`); items with no `moduleKey` are
  ungated and always available. `dashboard/layout.tsx` and
  `role-dialog.tsx`'s `RoleForm` both apply `filterNavByModules` **before**
  `filterNavByAccess` — so an institution's root admin ("unrestricted") only
  ever sees what their institution has been switched on for, and a custom
  Role's menu-access picker can never offer a menu item the institution
  itself doesn't have. Not every nav item has a matching module yet (e.g.
  Academic Sessions, Programs, Announcements) — those stay ungated rather
  than forcing a dubious mapping; only add a `moduleKey` where the
  correspondence is genuinely clear. `turon_admin` is pinned to
  `inst-xyz-college`, deliberately seeded with every module active, so it
  always shows a full nav — verified during development that pointing a
  login at a partially-linked institution (e.g. Babcock's 10-of-19 module
  set) correctly hides Registration, Transport, and most of Academics.
- **Institution admin logins authenticate against `UserManagerAccount`
  records, not a separate hardcoded list.** `authService.login`
  (`src/services/auth.service.ts`) only hardcodes `super_admin`; every other
  login matches `username`/`password` against `useUserManagersStore`,
  requires `status === "active"`, resolves the institution by matching
  `institutionName` against `useInstitutionsStore` (a denormalized string
  match, not a real FK — an accepted limitation of the mock layer), and then
  resolves the live Role by matching email against `useRbacStore`'s
  `ManagedUser` list (falling back to unrestricted if no match). So editing,
  resetting the password of, or deactivating an account on
  `/super-admin/user-manager` changes what actually works at `/login`
  immediately — there's no separate seed to keep in sync. **Keep one User
  Manager account per institution** — `turon_admin` → XYZ College of
  Technology, `amara_bello` → Ahmadu Bello University (a restricted "Front
  Desk Officer" Role tested against an institution that has _more_ modules
  active than her Role grants, so what she can't see proves the Role is
  limiting her, not the institution), `chrissmart10` → Babcock University,
  and so on for the rest of `user-managers.store.ts`'s seed — each is a
  distinct, independently-testable login. If you add a new demo scenario,
  add a new `UserManagerAccount` rather than reusing an institution that
  already has one.
- **No backend yet** (`backend/` is unscaffolded — see
  `backend/API_CONTRACT.md` for the spec every mock store below stands in
  for): every store in `src/store/` — `rbac.store.ts`,
  `institutions.store.ts`, `academics.store.ts`, `staff.store.ts` — is a
  `persist`-backed Zustand store standing in for a real API, seeded with
  demo data. `dashboard.store.ts` is the one exception: it's read-only mock
  data for the two dashboards' stat cards/chart/recent-list, so it's
  intentionally _not_ `persist`-backed (nothing ever mutates it locally) —
  when wiring it to a real API, call its `setStats`/`setEnrollment`/
  `setRecentStudents` after each fetch rather than adding persistence.
  `authService.login`
  (`src/services/auth.service.ts`) hardcodes three demo accounts (see its
  header comment for credentials) covering all three cases worth testing:
  the super admin, an unrestricted institution root admin, and a
  RBAC-restricted staff account. When wiring a new page to data, follow this
  same pattern — a small typed Zustand store with seed data — rather than
  reaching for a real fetch call, until `backend/` exists. Because
  `persist` only rehydrates in the browser, any component reading one of
  these stores **must** be a Client Component using the store's hook
  (`useXStore((s) => s.thing)`) — never `useXStore.getState()` in a Server
  Component, which would silently always show the seed data and never a
  user's changes.
- **Bump `version` whenever you change a persisted store's shape.** Every
  `persist(...)` config above has an explicit `version: 1`. When you add,
  rename, or remove a field on `rbac.store.ts`, `institutions.store.ts`,
  `academics.store.ts`, or `staff.store.ts` — or edit their seed data — bump
  that store's `version` by one in the same change. Without it, a browser
  that already ran an older build keeps its stale `localStorage` payload
  forever (zustand's `persist` only discards mismatched-version state; a
  matching version is trusted as-is and never reconciled against new seed
  data or fields) — the symptom is old/incomplete rows sitting next to
  blank columns for fields that didn't exist yet when that browser first
  loaded the app. There's no `migrate` function configured on any of these
  stores on purpose — the intent is "discard and reseed," not "carry old
  shapes forward," since this is all mock data standing in for a real API
  anyway.
- **New nav pages**: most `INSTITUTION_NAV`/`SUPER_ADMIN_NAV` entries beyond
  the ones with real pages currently render `<ModulePlaceholder>`
  (`src/components/shared/module-placeholder.tsx`) — a styled "not built yet"
  state, not a 404, so every link in both sidebars always goes somewhere real.
  Replace a placeholder with a real page (reusing `<PageHeader>` for the
  breadcrumb/date row) as its mockup arrives, rather than building ahead of
  the reference images.

## Commands

```bash
pnpm dev         # start dev server
pnpm build       # production build
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm format      # prettier --write .
```
