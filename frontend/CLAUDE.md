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
  (`src/app/super-admin/institutions/page.tsx`), User Manager
  (`src/app/super-admin/user-manager/page.tsx`), and License Manager
  (`src/app/super-admin/license-manager/page.tsx`) are the reference — same
  Card/CardHeader (Show-entries + Search, `flex flex-wrap items-center
justify-between gap-4` — not `flex-row`, which doesn't override
  `CardHeader`'s default `grid` and silently stacks the two instead of
  placing them on one row), same row entrance animation
  (`animate-in fade-in duration-300` per `<TableRow>`), same Action column: a
  single kebab (`MoreHorizontal`) button opening a `DropdownMenu` — never
  separate icon buttons and never an inline `Switch` for status. Item order
  is always Edit → resource-specific action (e.g. Activate/Deactivate, Reset
  password, Regenerate key) → separator → destructive Delete/Revoke. Every
  state-changing action is confirmed via `<ConfirmDialog>` first, and
  "delete" means either archive (soft-delete, restorable via the "View
  archived" toggle — Institutions, User Manager) or a reset-to-default
  (License Manager's "Revoke", since there's no separate record to
  destroy) — never a hard delete either way. Build every new admin list
  this exact way; if the pattern needs to change, change it in every table
  at once, not one at a time.
- **Every dropdown/date field goes through the shared `Notched*Field`
  components** (`src/components/shared/notched-field.tsx`), never a bare
  native `<select>` or `<input type="date">` — those render as unstyled OS
  chrome that breaks the notched-label look. Use `NotchedSelectField` (a
  real `Select`, base-ui) for short, fixed lists (gender, license type,
  status); `NotchedComboboxField` (`Popover` + `Command`/cmdk, searchable)
  for anything with "a lot of information" to scroll through — institutions,
  states/countries, and any future long list; `NotchedDateField` (`Popover`
  - the shadcn `Calendar`, `components/ui/calendar.tsx`) for any date
    picker, with "Clear"/"Today" shortcuts. All three keep the same public
    API shape as each other (`value`/`onValueChange` as a string, plus
    `label`/`labelClassName`/`disabled`) so swapping between them at a call
    site is a one-line change. Add new instances of "select with lots of
    options" or "pick a date" through these, not a new one-off.
- **Every uploaded image (logo, avatar) goes through
  `readFileAsDataUrl()`** (`src/lib/files.ts`), never
  `URL.createObjectURL()`. A blob URL only resolves in the browser tab that
  created it — it silently breaks the moment a `persist`-backed store
  writes it to `localStorage` and a _different_ tab or login session reads
  it back (or even the same tab after a reload). A data: URL is a plain
  string, so it survives that round trip. This matters concretely: a super
  admin uploading a User Manager account's avatar (or an institution's
  logo) must be visible both to the super admin later and to that
  account/institution's own login session — `URL.createObjectURL` cannot
  do that, `readFileAsDataUrl` can and does (verified in development).
- **In-app notifications are real and automated, not a static bell icon.**
  `src/store/notifications.store.ts` holds them (`persist`-backed);
  `src/lib/notify.ts` exports `notifyPlatform`/`notifyInstitution`/
  `notifyUser` — thin one-line wrappers, called at the exact same place as
  the existing `toast.success(...)` for every meaningful action
  (institution create/update/activate/deactivate/delete/restore, modules
  linked, license created/regenerated/revoked, a User Manager account
  create/update/activate/deactivate/delete/restore, a password reset).
  When adding a new mutating action anywhere, add its `notify*` call right
  next to its `toast.success` — don't let the two drift apart. Scoping
  (`platform` = every super admin; `institution` = that institution's own
  admins; `user` = one specific account) is resolved by
  `notificationsForUser()` in the same store file, shared by both the
  header's `NotificationsBell` dropdown
  (`src/components/features/notifications/`) and the full
  `/super-admin/notifications` / `/dashboard/notifications` list pages —
  never duplicate that filtering logic elsewhere.
- **Session Rollover is append-only and must never be confused with editing
  a student's level in place.** `src/types/student.ts`
  (`Student.academicHistory: StudentAcademicRecord[]`) and
  `src/types/rollover.ts` (`RolloverRecord`/`RolloverStudentEntry`) model a
  student's academic progression as a history log, not a mutable "current
  level" field — every rollover _appends_ a new record via
  `applyRolloverToStudent` (`src/lib/rollover.ts`), never rewrites or
  deletes a previous one. The decision engine
  (`computeRolloverEntry`, same file) is a pure function of a student's
  latest record: `isDeferred`/`holdForReview` short-circuit to
  `"deferred"`/`"hold"`; 3+ outstanding courses means `"repeat"` (the level
  itself wasn't earned); otherwise a student with 1-2 outstanding courses
  is `"promote-carryover"` — **promoted to the next level while those
  courses stay outstanding, never demoted back to repeat just for having a
  carryover.** `resolveToLevel(fromLevel, decision)` derives the
  destination level from whichever `decision` is current, and both
  `computeRolloverEntry` and the store's `updateEntryDecision`
  (`src/store/rollover.store.ts`) call it — **a manual override that
  changes `decision` must always recompute `toLevel` through this same
  function**; hardcoding the level from the original suggestion instead of
  re-deriving it from the new decision was a real bug caught during
  Playwright verification (an admin overriding `repeat` → `promote` re-tagged
  the badge but left the student's level unchanged until fixed). The
  wizard (`src/components/features/academics/rollover/rollover-wizard-dialog.tsx`)
  is a 5-step flow (source/destination → progression counts → student
  review + override → confirmation summary → success) with its own local
  `step` state and a draft `RolloverRecord` held in the store until
  `confirmRollover` is called — cancelling at any step calls `discardDraft`
  rather than leaving a half-applied record around. Building a Playwright
  check against this dialog: scope every button locator to
  `[role="dialog"]` (or a more specific `.filter({ hasText: ... })`) —
  the underlying `SessionTable`'s own pagination "Next" button is a second,
  usually-disabled match for a bare `button:has-text("Next")` and Playwright
  will silently grab it instead of the wizard's.
- **Student Management (`/dashboard/students`) shares its data model with
  Session Rollover, on purpose.** `src/store/students.store.ts` is the one
  store behind both the admin-table CRUD page and the rollover engine — a
  student created/edited there is the exact same `Student` record
  `computeRolloverEntry` later evaluates, so there is no separate "roster"
  to keep in sync. A student's display name is **always** assembled via
  `fullName()` (`src/lib/students.ts`) from `firstName`/`middleName`/
  `lastName` — never string-concatenated ad hoc — and their display code is
  `matricNo` (e.g. `"UL-10044"`), not a field literally named `studentId`
  (that name is used elsewhere for a _different_ thing —
  `RolloverStudentEntry.studentId` is the student's internal `id`, not this
  display code; don't conflate the two). `Student` also carries a full set
  of enrollment/bio-data fields (title, gender, marital status, religion,
  blood group, genotype, weight/height, nationality, state of origin, LGA,
  resident address, emergency contact) and a real `schoolId` FK to
  `School.id` (`src/store/schools.store.ts`) — the stricter FK pattern
  noted elsewhere in this file, not a denormalized school-name string. The
  table follows the standard admin-table pattern (§ above), extended with
  a checkbox column driving a "N selected → Delete Selected" bulk-archive
  bar, and real (not fake) Import Users/Export Users buttons — Export
  streams every non-archived student to a downloaded CSV via a transient
  `URL.createObjectURL` (fine for a one-shot download trigger; this is not
  the persisted-image case `readFileAsDataUrl` exists for), Import parses
  a CSV back into `createStudent` calls, skipping duplicate `matricNo`s and
  rows missing a required column. One addition worth noting on
  `createStudent` itself: it seeds a brand-new student's `academicHistory`
  with a single `status: "current"` record for their
  `currentSessionId`/`currentLevel` — a fresh enrollment is in-progress,
  not a completed one, so it must not be seeded as `"completed"` the way
  the rollover-testing seed data is. `archiveStudent`/`restoreStudent`
  follow the usual soft-delete convention, and `rollover.store.ts`'s
  `createDraft` filters out both archived AND `status: "inactive"`
  students — an inactive/withdrawn student is excluded from a rollover
  draft the same way an archived one is.
- **School Management (`/dashboard/academics/schools`) is a small,
  standalone admin table** — `School` (`src/types/school.ts`,
  `src/store/schools.store.ts`) is just `name`/`headName`/`designation`,
  following the standard admin-table pattern. Two fields that look like
  free text in an early draft are actually real selects, once the
  literal reference screenshot made it clear (the chevron-pair icon on
  each — `ChevronsUpDown`, the combobox affordance, not a plain
  single-chevron select): **Designation** is a `NotchedSelectField`
  sourced from the real `useStaffStore().designations` (the same list
  `/dashboard/staff/designations` manages) rather than free text — this
  is the second module to reuse that store, so treat it as the source of
  truth for designation names, not a place to fork a duplicate list.
  **School Head** is a `NotchedComboboxField` over a small curated
  candidate list defined locally in `school-dialog.tsx`
  (`SCHOOL_HEAD_CANDIDATES`) — there is no general "staff/person
  directory" resource yet to select a real record from, so don't treat
  this list as authoritative data; replace it with a real lookup once
  such a resource exists. `SEED_SCHOOL_IDS` exports stable, hand-picked
  ids for the two seeded rows (not the usual `makeId()`) specifically so
  `students.store.ts` can hardcode a `schoolId` FK against them at
  module-seed time — mirrors the same stable-seed-id convention
  `academics.store.ts` already uses for its sessions.
- **Faculty Management (`/dashboard/academics/faculties`) follows School
  Management's exact pattern one level down the hierarchy** — `Faculty`
  (`src/types/faculty.ts`, `src/store/faculties.store.ts`) is
  `name`/`deanName`/`schoolId`, with a real `schoolId` FK into
  `schools.store.ts` (`NotchedSelectField`, sourced from
  `useSchoolsStore().schools`) rather than a denormalized school-name
  string. **Dean of Faculty** is a `NotchedComboboxField` over its own
  small curated candidate list (`DEAN_CANDIDATES` in
  `faculty-dialog.tsx`) — same reasoning as School Head: no general
  staff/person directory exists yet, so don't treat this list as
  authoritative data.
- **Department Management (`/dashboard/academics/departments`) breaks the
  "derive School through Faculty" assumption the Faculty Management bullet
  above might suggest — don't extend that assumption without checking.**
  `Department` (`src/types/department.ts`,
  `src/store/departments.store.ts`) stores **both** `facultyId` and
  `schoolId` as independent FKs, rather than deriving the school through
  the faculty. This was a deliberate call based on the literal reference
  data, not an oversight: it pairs "Law Department" with Faculty of Law
  but a _different_ school than Faculty of Law's own `schoolId` in
  `faculties.store.ts` — so this resource genuinely doesn't enforce
  school → faculty → department as strict containment, and modeling it
  that way would have silently contradicted the reference. The Add/Edit
  dialog accordingly shows Faculty and School as two separate
  `NotchedSelectField`s the admin picks independently, matching that same
  literal reference (its dialog screenshot, mislabeled "Add New
  Semester/Session" — another copy-paste artifact corrected to "Add New
  Department" per this app's consistent dialog-title convention). H.O.D
  is the usual `NotchedComboboxField` over a curated candidate list
  (`HOD_CANDIDATES` in `department-dialog.tsx`). `faculties.store.ts`
  gained a third seeded row, "Faculty of Mathematics" (and a
  `SEED_FACULTY_IDS` export with stable ids, mirroring
  `SEED_SCHOOL_IDS`), specifically so this module's seed data could
  reference a faculty the reference screenshot named that didn't exist
  yet — the same "add what's missing to a shared list" move already used
  for Staff Designations' "Vice Chancellor". `departments.store.ts`
  itself later gained a `SEED_DEPARTMENT_IDS` export (and two more seeded
  rows, "Computing Department"/"Administration Department") for the exact
  same reason when Program Management needed departments that didn't
  exist yet — this "add a stable-id export + whatever rows the next
  module needs" move is now the established way to extend an
  already-shipped seed store for a new FK, not just a one-off.
- **Program Management (`/dashboard/academics/programs`) reads the
  reference screenshot's "School" column as mislabeled, not literal —
  check header/value mismatches like this before modeling a field.** The
  table's 4th column was headed "School" but its actual values were
  "Undergraduate"/"Postgraduate" — a program-type distinction, not a
  school name (no real school called "Undergraduate" exists or should
  exist). `Program` (`src/types/program.ts`,
  `src/store/programs.store.ts`) therefore has a real
  `programType: "Undergraduate" | "Postgraduate"` field and no `schoolId`
  at all, alongside independent `departmentId`/`facultyId` FKs (following
  Department's precedent above — two parent-ish FKs, not one derived
  through the other). Same reasoning as correcting "Median Name" → Maiden
  Name and the mismatched dialog titles elsewhere in this hierarchy: a
  visibly wrong label/value in the source is corrected, not reproduced.
- **Program Levels (`/dashboard/academics/program-levels`) is a flat,
  independent lookup table — deliberately NOT wired into the existing
  `StudentLevel` type or the rollover engine.** `ProgramLevel`
  (`src/types/program-level.ts`, `src/store/program-levels.store.ts`) is
  just `levelCode`/`description` (e.g. `"100"` / `"100 levels"`), with no
  relationship to `STUDENT_LEVELS` in `src/types/student.ts` or anything
  in `src/lib/rollover.ts`. Those two systems look related (both use
  "100"/"200"/etc.) but keeping them separate was deliberate: `rollover.ts`
  depends on `StudentLevel` being a fixed TypeScript union for
  exhaustiveness (`PROGRAMME_LEVEL_ORDER`, `COURSES_BY_LEVEL`) — making
  levels admin-editable here would require a real refactor of that
  already-verified engine, which nothing has asked for. If a future
  request explicitly asks to unify them, that's a deliberate, larger
  follow-up — not something to do incidentally while building this page.
- **Courses Grades (`/dashboard/academics/course-grades`) pairs a normal
  admin-table CRUD with one standalone, non-tabular setting rendered
  below it.** `CourseGrade` (`src/types/course-grade.ts`,
  `src/store/course-grades.store.ts`) is the usual per-row resource
  (`code`/`remark`/`gradeScore`/`minimumScore`/`maximumScore`, with a
  `maximumScore > minimumScore` validation on save) — but the same store
  also holds a single `maxGradePoint` number with its own
  `setMaxGradePoint` action, rendered as a small standalone
  `NotchedField` + Save button beneath the table (`MaxGradePointForm` in
  the page file), not as another table row. If a future page shows this
  same "table plus one global setting" shape, put the setting in the same
  store as a plain field/setter rather than modeling it as a fake
  single-row resource.
- **Courses Management (`/dashboard/academics/courses`) follows the same
  independent-FK pattern as Departments/Programs, and reuses the
  Import/Export CSV pattern from Student Management.** `Course`
  (`src/types/course.ts`, `src/store/courses.store.ts`) has `departmentId`
  and `schoolId` as two separately-picked FKs (not one derived through the
  other), with course `code` — not `name` — as the field validated for
  uniqueness, matching how course codes actually work in academia. Its
  reference data named a department ("Computer Studies") and two schools
  ("School of Technology", "School of Statistics") that didn't exist yet
  — extended `departments.store.ts` and `schools.store.ts` with them
  (each store's now-established `SEED_*_IDS` stable-id export + a version
  bump), the same "backfill the shared seed" move used repeatedly through
  this whole Academics hierarchy. Import/Export buttons mirror
  `src/app/dashboard/students/page.tsx`'s implementation exactly (a
  transient `URL.createObjectURL` CSV download for Export, `FileReader` +
  `createCourse` calls for Import, skipping duplicate course codes) — copy
  that pattern rather than re-deriving it for any future CSV-driven list.
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
  `institutions.store.ts`, `academics.store.ts`, `staff.store.ts`,
  `students.store.ts`, `schools.store.ts`, `faculties.store.ts`,
  `departments.store.ts`, `programs.store.ts`, `program-levels.store.ts`,
  `course-grades.store.ts`, `courses.store.ts`, `rollover.store.ts` — is a
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
  `persist(...)` config in `src/store/` has an explicit version number and
  a `migrate: () => (<fresh seed/empty state>)` — every persisted store in
  this codebase follows the same "migrate always resets" pattern, not a
  real field-by-field migration, since this is all mock data standing in
  for a real API and the intent is "discard and reseed," not "carry old
  shapes forward." When you add, rename, or remove a field on any of these
  stores — or edit their seed data — bump that store's `version` by one in
  the same change; the `migrate` function needs no corresponding edit
  (it already just returns a fresh seed). Without the version bump, a
  browser that already ran an older build keeps its stale `localStorage`
  payload forever (zustand's `persist` only discards mismatched-version
  state; a matching version is trusted as-is and never reconciled against
  new seed data or fields) — the symptom is old/incomplete rows sitting
  next to blank columns for fields that didn't exist yet when that browser
  first loaded the app.
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
