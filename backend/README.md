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
curl http://localhost:8080/api/health
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
│  │  │  ├─ config/
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
