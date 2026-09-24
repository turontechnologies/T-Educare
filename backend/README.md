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
│  │  │  ├─ profile/      # GET/PATCH profile, password change
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
that's the next thing to move onto the DB. Everything else in
`API_CONTRACT.md` (institutions, roles, users, academics, staff, students,
notifications, etc.) has no backend yet — the frontend still mocks those via
its Zustand stores.

Verified end-to-end via `docker compose up -d --build` (both `sqlserver` and
`app` services): Flyway applies the migration, the app connects to
`teducare_db` on the `sqlserver` service, `POST /auth/login`,
`GET /dashboard/stats`, and `GET /profile` all return real, DB-backed data,
and a value written by an earlier test run (`amara_bello`'s phone number)
was still there after the containers were fully torn down and recreated —
confirming this is real persistence, not just an in-memory demo that resets
on restart.

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
