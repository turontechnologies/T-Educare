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
`frontend/CLAUDE.md`). §4.6 (Modules) and §4.7 (License Manager) remain
unbuilt — the frontend's actions for those stay local-only (in-memory,
reset on reload), clearly flagged in their own UI rather than pretending
to persist. Everything else in `API_CONTRACT.md` (roles, users, academics,
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
JPEG/WEBP only, 5MB max. Wired to the frontend for institution logos; not
yet for profile avatars (still a local data URL there).

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
