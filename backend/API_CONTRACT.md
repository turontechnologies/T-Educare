# T-Educare — API Contract

This is the spec the backend must implement so the existing frontend (already
built against a mocked version of this contract — see
[frontend/CLAUDE.md](../frontend/CLAUDE.md#no-backend-yet)) works unchanged
once wired to a real API. It supersedes the short version in
[README.md](./README.md).

Frontend reference points, if anything here is ambiguous:

- `frontend/src/services/auth.service.ts` — current mocked `authService`
- `frontend/src/store/rbac.store.ts` — Role/ManagedUser shape + seed data
- `frontend/src/store/institutions.store.ts` — Institution shape + seed data
- `frontend/src/store/academics.store.ts`, `src/store/staff.store.ts` — the
  two other mocked domains already wired to real pages
- `frontend/src/config/nav.ts` — the full, authoritative list of menu **keys**
  (`INSTITUTION_NAV`, `SUPER_ADMIN_NAV`) referenced by `Role.menuKeys` below

This document only covers what the frontend currently calls. More resources
(Registration, full Academics CRUD, Financials, Results, Hostel, Transport,
Announcements, Requests, Support, etc.) exist today only as nav entries
pointing at placeholder pages — their contracts will follow the same
conventions below and get added here as each one is built.

## Status

**Not implemented yet.** `backend/` has no code — see
[README.md](./README.md) for scaffolding steps. This file is what to build
*against*.

---

## 1. Conventions

- **Base URL**: `NEXT_PUBLIC_API_URL` (frontend `.env`), all paths below are
  relative to it.
- **Auth**: `Authorization: Bearer <token>` on every request except
  `POST /auth/login`. An invalid/expired token → `401`, which the frontend's
  axios interceptor treats as a forced logout.
- **Content type**: `application/json` both ways.
- **IDs**: opaque strings (UUID/cuid — anything stable and non-guessable).
- **Timestamps**: ISO 8601 UTC strings, e.g. `"2026-03-10T14:32:00.000Z"`.
- **Errors**: any non-2xx returns

  ```json
  { "error": "Human-readable message safe to show the user" }
  ```

  (`frontend/src/lib/axios.ts` reads `error.response.data.error` directly
  into the toast shown to the user — keep it short and non-technical.)
- **Lists**: paginated resources return

  ```json
  { "data": [ /* items */ ], "meta": { "page": 1, "perPage": 20, "total": 57 } }
  ```

  Query with `?page=1&perPage=20`. Small, bounded lists (roles, sessions,
  designations — anything an institution manages by hand, not "every
  student") may skip pagination and just return `{ "data": [...] }`.
- **Multi-tenancy is server-enforced, not client-supplied.** Every
  institution-scoped resource (roles, users, sessions, semesters,
  designations, and everything that follows) is implicitly filtered by the
  authenticated user's own institution — derived from their token server-side.
  Never accept a client-supplied `institutionId` on these routes; a request
  from institution A must be structurally incapable of reading or writing
  institution B's data, regardless of what a client sends.

---

## 2. Data model

```mermaid
erDiagram
    INSTITUTION ||--o{ ROLE : "defines"
    INSTITUTION ||--o{ USER : "employs"
    INSTITUTION ||--o{ ACADEMIC_SESSION : "runs"
    INSTITUTION ||--o{ STAFF_DESIGNATION : "defines"
    ACADEMIC_SESSION ||--o{ ACADEMIC_SEMESTER : "contains"
    ROLE ||--o{ USER : "assigned to"

    INSTITUTION {
        string id PK
        string name
        int modulesCount
        int studentCount
        int revenue
        string status "active | inactive"
        datetime createdAt
    }
    ROLE {
        string id PK
        string institutionId FK
        string name
        string description
        string[] menuKeys "keys from frontend/src/config/nav.ts"
        bool isSystem "true = root admin role, uneditable"
        datetime createdAt
    }
    USER {
        string id PK
        string institutionId FK "null for super_admin"
        string roleId FK "null for super_admin"
        string firstName
        string lastName
        string email
        string role "super_admin | institution_admin"
        string status "active | suspended"
        datetime createdAt
    }
    ACADEMIC_SESSION {
        string id PK
        string institutionId FK
        string session "e.g. 2024/2025"
        date from
        date to
    }
    ACADEMIC_SEMESTER {
        string id PK
        string sessionId FK
        string name
        string description
        date from
        date to
    }
    STAFF_DESIGNATION {
        string id PK
        string institutionId FK
        string name
        string description
        string category "Academic Staff | Non-Academic Staff"
    }
```

---

## 3. Auth

### `POST /auth/login`

```json
// Request
{ "username": "Turon_Admin", "password": "Turon@2024" }
```

```json
// Response 200
{
  "user": {
    "id": "usr_123",
    "firstName": "Christian",
    "lastName": "Smart",
    "email": "christian.smart@turontech.com",
    "role": "institution_admin",
    "institutionId": "inst_xyz",
    "institutionName": "XYZ College of Technology",
    "menuKeys": null
  },
  "token": "opaque-bearer-token"
}
```

- `role` is `"super_admin"` or `"institution_admin"`.
- `menuKeys` is the **resolved** permission set for this login, so the
  frontend can render the sidebar without a second round trip:
  - `null` → unrestricted (root admin of the institution, or super admin).
  - `string[]` → exactly the keys from `frontend/src/config/nav.ts` this user
    may see, resolved server-side from their `Role.menuKeys` at login time.
- Wrong credentials → `401 { "error": "Invalid username or password." }`
  (exact copy the frontend already shows for its mocked version — keep it,
  or update `frontend/src/services/auth.service.ts` to match a new one).

### `GET /auth/me`

Returns the same `user` shape as login, for session restore. Requires a
valid bearer token.

### `POST /auth/logout`

Invalidates the token server-side if your auth scheme supports that (e.g.
a session/refresh-token store). `204` on success. The frontend already
clears its own local state regardless of this call's outcome.

```mermaid
sequenceDiagram
    participant U as Browser
    participant F as Frontend (Next.js)
    participant A as Backend /auth

    U->>F: submit username + password
    F->>A: POST /auth/login
    A->>A: verify credentials
    A->>A: resolve Role -> menuKeys (null if root admin/super admin)
    A-->>F: 200 { user (incl. menuKeys), token }
    F->>F: persist token + user (Zustand, localStorage)
    F->>F: filterNavByAccess(NAV_TREE, user.menuKeys)
    F-->>U: redirect to /super-admin or /dashboard with filtered sidebar
```

---

## 4. Institutions — super admin only

All routes below require `role: "super_admin"` → otherwise `403`.

| Method | Path                    | Body                                          | Notes |
|--------|-------------------------|------------------------------------------------|-------|
| GET    | `/institutions`         | —                                              | list, supports pagination |
| POST   | `/institutions`         | `{ name, modulesCount }`                       | `studentCount`/`revenue` default `0`, `status` defaults `"active"` |
| PATCH  | `/institutions/:id`     | any subset of `Institution` fields             | |
| DELETE | `/institutions/:id`     | —                                              | |

`Institution` response shape — see the ER diagram above.

---

## 5. Roles — institution admin, scoped to their own institution

All routes require `role: "institution_admin"`; results are implicitly
scoped to the caller's `institutionId`.

| Method | Path          | Body                                                    | Notes |
|--------|---------------|----------------------------------------------------------|-------|
| GET    | `/roles`      | —                                                        | includes the seeded system role |
| POST   | `/roles`      | `{ name, description, menuKeys: string[] }`               | `isSystem` always `false` for created roles |
| PATCH  | `/roles/:id`  | `{ name?, description?, menuKeys? }`                       | `403` if the target role `isSystem: true` |
| DELETE | `/roles/:id`  | —                                                        | `403` if `isSystem: true`; `409` if any user is still assigned it |

`menuKeys` must be validated server-side against the known key set (mirror
`frontend/src/config/nav.ts`'s `INSTITUTION_NAV` keys) — reject unknown keys
rather than silently storing them.

## 6. Users (staff) — institution admin, scoped to their own institution

| Method | Path          | Body                                        | Notes |
|--------|---------------|-----------------------------------------------|-------|
| GET    | `/users`      | —                                            | staff within the caller's institution |
| POST   | `/users`      | `{ name, email, roleId }`                     | `status` defaults `"active"`; this is what provisions a real login for that staff member (send them a credential/invite — mechanism is up to the backend) |
| PATCH  | `/users/:id`  | `{ name?, email?, roleId?, status? }`          | |
| DELETE | `/users/:id`  | —                                            | |

```mermaid
flowchart LR
    A[Staff signs in] --> B{role assigned?}
    B -- "system role (root admin)" --> C[menuKeys = null]
    B -- "custom role" --> D[load Role.menuKeys]
    C --> E[Frontend renders full sidebar]
    D --> F[Frontend renders only those menu items]
    E --> G[Every dashboard route reachable]
    F --> H[Only routes behind an allowed key reachable]
```

---

## 7. Academic Sessions & Semesters — institution admin

| Method | Path                        | Body                                                        |
|--------|-----------------------------|---------------------------------------------------------------|
| GET    | `/academic-sessions`        | —                                                              |
| POST   | `/academic-sessions`        | `{ session, from, to }`                                        |
| DELETE | `/academic-sessions/:id`    | —                                                              |
| GET    | `/academic-semesters`       | —                                                              |
| POST   | `/academic-semesters`       | `{ sessionId, name, description, from, to }`                    |
| DELETE | `/academic-semesters/:id`   | —                                                              |

`from`/`to` are plain `dd-mm-yyyy` strings in the current frontend mock —
either keep that (simplest, matches existing UI verbatim) or switch to ISO
dates and update `frontend/src/store/academics.store.ts` + the two forms in
`frontend/src/app/dashboard/academics/sessions/page.tsx` together.

## 8. Staff Designations — institution admin

| Method | Path                        | Body                                             |
|--------|-----------------------------|-----------------------------------------------------|
| GET    | `/staff-designations`       | —                                                    |
| POST   | `/staff-designations`       | `{ name, description, category }`                     |
| PATCH  | `/staff-designations/:id`   | `{ name?, description?, category? }`                   |
| DELETE | `/staff-designations/:id`   | —                                                    |

`category` is `"Academic Staff" | "Non-Academic Staff"`.

---

## 9. Dashboards

Both dashboards (`frontend/src/app/dashboard/page.tsx` and
`frontend/src/app/super-admin/page.tsx`) read from
`frontend/src/store/dashboard.store.ts` and `institutions.store.ts` today —
these routes are what should replace those stores' seed data.

### 9.1 Institution admin — `GET /dashboard/stats`

Scoped to the caller's own institution.

```json
{
  "registeredStudents": 48043,
  "applicants": 158429,
  "lecturers": 10238,
  "accumulatedProfit": 1248043
}
```

### 9.2 Institution admin — `GET /dashboard/enrollment?range=day|week|month`

Powers the "Registered students per program" chart. `range` defaults to
`"day"`.

```json
{ "data": [ { "label": "6am", "value": 8 }, { "label": "9am", "value": 22 } ] }
```

`label` is whatever the frontend should print on the x-axis for that
`range` (hour-of-day for `day`, weekday for `week`, month for `month`) —
the backend owns the bucketing, the frontend just renders what it's given.

### 9.3 Institution admin — `GET /dashboard/recent-students?limit=4`

```json
{
  "data": [
    { "id": "std_1", "name": "Amaka Chukwu", "registeredAt": "2026-09-10T07:12:00.000Z" }
  ]
}
```

`registeredAt` is a real ISO timestamp — the frontend formats it as relative
time ("2 hours ago") itself, don't pre-format it server-side.

### 9.4 Super admin — `GET /super-admin/stats`

A precomputed summary so the client doesn't have to page through every
institution just to sum three numbers (it can still cross-check against
`GET /institutions` — see §4 — but shouldn't have to).

```json
{ "institutionsCount": 3, "totalStudents": 210, "totalRevenue": 255000 }
```

The "Recent Added Institutions" table on this same dashboard is just
`GET /institutions` (§4) sorted by `createdAt` desc, `limit=5` — no separate
endpoint needed.

```mermaid
sequenceDiagram
    participant U as Browser
    participant F as Frontend
    participant B as Backend

    U->>F: open /dashboard or /super-admin
    par
        F->>B: GET /dashboard/stats (or /super-admin/stats)
    and
        F->>B: GET /dashboard/enrollment?range=day
    and
        F->>B: GET /dashboard/recent-students?limit=4
    end
    B-->>F: 200 for each
    F->>F: useDashboardStore.setStats / setEnrollment / setRecentStudents
    F-->>U: render stat cards, chart, recent list
    U->>F: click "Week" / "Month"
    F->>B: GET /dashboard/enrollment?range=week
    B-->>F: 200 { data }
    F-->>U: chart re-renders with the new range, no full page reload
```

---

## 10. What's mocked today, for reference

Until the above exists, the frontend fakes all of it client-side with three
hardcoded demo accounts (see `frontend/src/services/auth.service.ts`) and
Zustand stores seeded with fixture data (`persist`-backed for anything a user
edits — roles, users, institutions, sessions, designations; plain, unpersisted
for read-only dashboard data — see `dashboard.store.ts`) — swap each store's
actions for real calls to the routes above one domain at a time; nothing
else in the UI needs to change.
