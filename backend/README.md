# T-Educare Backend

This is the backend service for the T-Educare platform. It lives in its own
standalone folder and is built with Java 21 + Spring Boot 3.3 + MSSQL.

## Stack

- Java 21
- Spring Boot 3.3.5
- Spring Web, Spring Data JPA, Spring Security, Validation
- Microsoft SQL Server via `mssql-jdbc`
- Flyway for schema migrations
- JWT-based authentication
- Docker Compose for local SQL Server + app runtime

## Local development

### 1) Start the database

```bash
cd backend
cp .env.example .env
docker compose up -d sqlserver
```

### 2) Run the app

```bash
cd backend
mvn spring-boot:run
```

Or via Docker:

```bash
cd backend
docker compose up -d --build
```

### 3) Health check

```bash
curl http://localhost:8080/api/health   # mvn spring-boot:run (SERVER_PORT default)
curl http://localhost:8081/api/health   # docker compose (host 8081 -> container 8080)
```

Expected response:

```json
{"status":"ok","service":"teducare-backend","timestamp":...}
```

## Configuration

The app reads environment variables from `.env` or the environment. The main
settings are in `src/main/resources/application.yml`.

Key values:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

## Project layout

```text
backend/
├─ src/
│  ├─ main/
│  │  ├─ java/com/teducare/
│  │  │  ├─ auth/         # login, JWT issuance, MSSQL-backed user directory
│  │  │  ├─ config/       # SecurityConfig, JwtService, CustomAuthenticationProvider
│  │  │  ├─ common/       # GlobalExceptionHandler
│  │  │  ├─ dashboard/    # super-admin + institution-admin dashboard stats
│  │  │  ├─ institution/  # Institutions list/create/edit/status/archive (super admin)
│  │  │  ├─ usermanager/  # User Manager — institution_admin accounts (super admin)
│  │  │  ├─ module/       # Modules catalog + linking modules to an institution
│  │  │  ├─ notification/ # In-app notifications (list/unread-count/read/dismiss)
│  │  │  ├─ profile/      # GET/PATCH profile, password change
│  │  │  ├─ upload/       # POST /uploads (Cloudinary)
│  │  │  ├─ health/
│  │  │  └─ TeducareBackendApplication.java
│  │  └─ resources/
│  │     ├─ application.yml
│  │     └─ db/migration/
│  └─ test/
├─ docker-compose.yml
├─ Dockerfile
├─ pom.xml
├─ .env.example
├─ README.md
└─ CLAUDE.md
```

## What's implemented

Auth, Dashboard, and Profile (§3, §9, and the Profile section of
`API_CONTRACT.md`) are real, working endpoints — not scaffolding. `auth/`
is now **MSSQL-backed for real**: `dbo.users` (`db/migration/V1__init_schema.sql`,
applied by Flyway on startup — `flyway.enabled: true`) holds the account
rows, `auth/UserAccount.java`/`UserAccountRepository.java` are the JPA
entity/repository, and `auth/AuthDirectory.java` is a thin wrapper over the
repository (BCrypt-hashed passwords, mutated via `repository.save()` on
password/profile updates — no more in-memory map). `auth/DemoAccountSeeder.java`
inserts the 3 demo accounts once on first boot if the table is empty, so a
fresh `docker compose up` seeds itself. Dashboard numbers are still
static/hardcoded per-institution rather than computed from real rows —
that's still worth moving onto the DB later.

**Institutions §4.1/4.3/4.4 (list/create/edit, activate/deactivate,
archive/restore) are also real now, and wired to the frontend** —
`institution/Institution.java` (JPA entity, table `dbo.institutions`,
`V2__institutions.sql`), `InstitutionRepository`/`InstitutionService`/
`InstitutionController`, seeded with 5 demo institutions
(`DemoInstitutionSeeder.java`) including the two already referenced by the
`turon_admin`/`amara_bello` login accounts. `institutions.store.ts` no
longer mocks this — it's hydrated from the real endpoints (see
`frontend/CLAUDE.md`). §4.5 (User Manager) and §4.6 (Modules) are also
real and wired to the frontend now (see their own sections below); only
§4.7 (License Manager) remains unbuilt — its dialog's actions stay
local-only (in-memory, reset on reload), clearly flagged in its own UI
rather than pretending to persist. Everything else in `API_CONTRACT.md`
(roles, users, academics,
staff, students, notifications, etc.) has no backend yet — the frontend
still mocks those via its Zustand stores.

**§4.5 User Manager is real now too, backend-only for now** —
architecturally, this reuses `auth/UserAccount.java`/`dbo.users` directly
(filtered to `role = 'institution_admin'`) rather than a separate table,
since per §3's own design a User Manager account *is* the institution_admin
login identity, not a parallel record. `usermanager/UserManagerController`/
`Service`/`Response` cover list/create/edit/reset-password/activate-
deactivate/archive-restore. Creating one immediately produces a real,
working login — verified live. Deactivating or archiving one blocks login
the same way institution deactivation does. `V4__user_manager_fields.sql`
added the missing columns to `dbo.users`; `V5` backfilled the 2 pre-existing
demo institution_admin accounts to match, since they'd existed since
before V4 and `DemoAccountSeeder` only seeds an empty table.

**Deactivating an institution actually blocks its logins now** —
`CustomAuthenticationProvider` checks the real institution's `status`
right after the password check; an `inactive` institution's accounts get
a clear `401` on their *next* login attempt (already-issued JWTs from
before deactivation aren't revoked — there's no session/token store to
revoke them from). `institutionName`/`institutionLogoUrl` in the login/`me`
response are resolved **live** from the real Institution record every
time, not a stale snapshot — renaming an institution or setting its logo
takes effect on that institution's accounts' next login automatically.

**File uploads (§3.2) are real too** — `POST /uploads` (`upload/UploadController.java`)
does a server-side signed upload to Cloudinary (`config/CloudinaryConfig.java`,
same account as the sibling `t-coop-backend` project — credentials in
`.env`, never in `.env.example`). Any authenticated user can call it; PNG/
JPEG/WEBP only, 5MB max. Wired to the frontend for institution logos, User
Manager avatars, and (as of 2026-09-24) individual profile avatars too.

**§4.6 Modules is real, and wired to the frontend (2026-09-26)** — extends
the existing `Institution` resource rather than a new table (`module_keys`,
`modules_last_edited_at`, `modules_count` columns already existed on
`dbo.institutions`, unused until now). Endpoints: `GET /modules` (the fixed
catalog, `module/ModuleCatalog.java` — 22 entries as of this writing, one
per real nav item in the institution_admin dashboard, `dashboard` itself
the sole exception; must stay key-for-key in sync with
`frontend/src/config/nav.ts`'s `moduleKey`s), `PATCH /institutions/:id/modules`
(a full **replace** of `moduleKeys`, not an additive merge — whatever list
is sent becomes the institution's entire module set; also sets
`modulesCount`/`modulesLastEditedAt` and activates the institution, per the
documented "X is been selected and made active" side effect; rejects an
unknown key with `400`), and `GET /institutions?unlinkedOnly=true` (only
institutions with an empty `moduleKeys`, for the "Select an Institution"
dropdown in the "Link New Institution" dialog).

**A real, previously-undetected bug was caught and fixed while building
this**: `GET /institutions` was gated `super_admin`-only, but
`dashboard/layout.tsx` (the institution_admin side) calls this exact same
endpoint to resolve its own institution's live `moduleKeys`/name/logo —
meaning every institution_admin session was silently getting a `403` on
that fetch, resolving an *empty* `moduleKeys` list, which gated their whole
nav down to only the ungated items (Dashboard, Academic Sessions, User
Management) regardless of what modules the super admin had actually
switched on for them. Confirmed live against `turon_admin` before fixing —
not hypothetical. Fixed by scoping `GET /institutions` per caller instead
of a blanket role check: a `super_admin` still gets the full paginated list;
an `institution_admin` now gets a single-row response containing only their
own institution (`InstitutionService.listOwn`), never the full platform
list (§1's multi-tenancy rule) but no longer a `403` either.

**§4.5 User Manager is now wired to the frontend as well (2026-09-24)** —
`/super-admin/user-manager` calls the real endpoints directly (no more
mock store on the frontend side); see `frontend/CLAUDE.md` for the
read/write architecture. Separately, `frontend/hooks/use-login.ts` gained
a `useMe()` session-refresh hook (wired into both dashboard layouts) so
that an account edited here — or an institution renamed/relogoed via
Institutions — is reflected for that user without requiring a fresh
login, since the backend already resolved all of this live on every
`/auth/me` call and the frontend just wasn't asking again mid-session.

**§4.7 License Manager is real, and wired to the frontend (2026-09-26)** —
the same "extend `Institution`, don't add a table" pattern as Modules:
`licenseType`/`expiringAt`/`licenseKey`/`licenseIssuedAt` all already
existed as columns (added alongside Institutions/Modules), just with no
endpoint to write the license-specific two of them until now (`tokenKey`
is a different field entirely — the institution's general API token, set
at creation, shown read-only here and never edited). Endpoints:
`PATCH /institutions/:id/license` (sets `licenseType`/`expiringAt`/
`licenseKey`; `"Basic"` forces `expiringAt` to `null` server-side
regardless of what's sent, since it's the free, never-expiring tier; any
other type with no `expiringAt` is rejected `422`; `licenseIssuedAt` is
set to now only the *first* time an institution ever gets a license —
immutable afterwards, so re-editing type/key/expiry later never resets its
original issue date), `POST /institutions/:id/regenerate-license-key`
(`200, { "licenseKey": "<new>" }` — rejects `400` if the institution has no
license to regenerate a key for), and `POST /institutions/:id/revoke-license`
(resets to the unlicensed defaults — Basic, no key/expiry/issued-date —
without archiving or otherwise touching the institution itself), plus
`GET /institutions?unlicensedOnly=true` for the "Select Institution"
dropdown in "Create New License" (must never offer an institution that
already has one). `/super-admin/license-manager` calls these real endpoints
directly now — this was the app's last remaining local-only screen, so
`institutions.store.ts`'s `localOverrides`/`updateInstitution()` machinery
(see `frontend/CLAUDE.md`) is deleted outright, not just unused. Every
field on every resource above is real and server-backed now.

**§10 Notifications is real too, and wired to the frontend, same day
(2026-09-26)** — explicitly requested ("make sure the notification is
coming from the backend"), after the frontend-only mock version had been
running since early in this project. New `notification/` package: a real
`dbo.notifications` table (`V6__notifications.sql`), not an extension of
an existing resource this time, since a notification doesn't belong to
any single one of them. `NotificationService.notifyPlatform()`/
`notifyInstitution()`/`notifyUser()` are the server-side equivalent of
`frontend/src/lib/notify.ts`'s three functions, called from
`InstitutionService`/`UserManagerService` at the exact same success
points the frontend's own call sites used to fire from — every mutating
method on both (create/update/status/archive/restore/linkModules/
saveLicense/regenerateLicenseKey/revokeLicense on Institutions;
create/update/status/resetPassword/archive/restore on User Manager) now
creates one. `GET /notifications` scopes to the caller server-side
(own `user` rows, plus their institution's rows if they're an
institution_admin, plus every `platform` row if they're a super_admin) —
any authenticated user can call it, no role restriction, since everyone
reads only their own feed. `GET /notifications/unread-count` exists
specifically so the frontend bell doesn't have to fetch and count the
full list on every render. `PATCH /notifications/:id/read` and
`DELETE /notifications/:id` both 404 (never 403) for an out-of-scope id —
never confirms another user's or institution's notification even exists.
`POST /notifications/read-all` is a bulk `@Modifying` JPQL update — the
first one of those in this codebase — and needed `@Transactional` on the
service method calling it; every other write elsewhere goes through
`JpaRepository`'s already-transactional `save()`/`delete()`, so this was a
genuinely new failure mode here (`InvalidDataAccessApiUsageException`,
caught by the test suite, not by manual testing). **Only wired into
resources that are actually real** — Students/Staff/Academic Sessions/
etc. have no backend at all yet, so their existing `notify.ts` call sites
on the frontend are untouched; the frontend merges the real feed with
whatever's still locally-generated for those (see `frontend/CLAUDE.md`),
so nothing regressed for domains this pass didn't touch.

Verified end-to-end via `docker compose up -d --build` (both `sqlserver` and
`app` services): Flyway applies all 3 migrations, the app connects to
`teducare_db` on the `sqlserver` service, login/dashboard/profile/
institutions all return real DB-backed data, `POST /uploads` returns a
genuine `res.cloudinary.com` URL for a real uploaded file, and a value
written by an earlier test run (`amara_bello`'s phone number) was still
there after the containers were fully torn down and recreated — confirming
this is real persistence, not an in-memory demo that resets on restart.

**Two real bugs were caught and fixed while building Institutions, worth
knowing about if something similar bites again:**

1. `SecurityConfig`'s `AuthenticationManager` bean used to be built via
   `AuthenticationConfiguration.getAuthenticationManager()` — a
   bean-creation-order-sensitive path that silently fell back to Spring
   Boot's default in-memory user (breaking *every* login, not just new
   endpoints) once the bean graph grew past a certain size. Fixed by
   building it directly as `new ProviderManager(customAuthenticationProvider)`
   instead — no ordering dependency, can't silently fall back.
2. `V1__init_schema.sql` had created placeholder `dbo.institutions`/
   `dbo.roles`/`dbo.auth_tokens` tables (a handful of stub columns each)
   long before any real feature used them. When `V2__institutions.sql`
   later tried to create the *real* `dbo.institutions` table, its own
   `IF OBJECT_ID(...) IS NULL` guard saw the stub already existed and
   silently no-op'd — so the real table never got created, and Hibernate
   failed at query time with `Invalid column name 'address'`. Fixed with
   `V3__fix_institutions_schema.sql` (unconditional `DROP TABLE` + recreate
   — safe, since the stub never held real data). **The same landmine still
   exists for `dbo.roles`/`dbo.auth_tokens`** — see `CLAUDE.md`'s note
   before building anything against those.

## CORS and frontend integration

The backend permits requests from:

- `http://localhost:3000`
- `https://t-educare.vercel.app`

This is configured in `SecurityConfig` and `application.yml` so the local app
and deployed frontend can both reach the API.

## Notes

- This is intentionally a clean standalone backend app, independent of the
  frontend package manager setup.
- The API contract is tracked in `API_CONTRACT.md` and should be treated as the
  source of truth for future routes and payloads.
