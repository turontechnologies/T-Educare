# T-Educare — Backend

Not yet scaffolded. This folder is reserved for the API service the
[frontend](../frontend) talks to via `NEXT_PUBLIC_API_URL`
(see `frontend/src/lib/axios.ts`).

## Expected contract

The frontend already assumes a conventional REST-ish shape (see
`frontend/src/services/auth.service.ts` and
`frontend/src/lib/validations/auth.schema.ts`):

- `POST /auth/login` → `{ user, token }`
- `GET /auth/me` → `user`
- `POST /auth/logout`
- Errors as `4xx`/`5xx` with a JSON body containing a human-readable message
  (`src/lib/axios.ts` on the frontend reads `error.response.data.error`) —
  keep the backend's error shape consistent with that, or update the
  interceptor to match whatever shape is chosen.
- Auth via `Authorization: Bearer <token>` on every request except
  `/auth/login`.

## Setting this up

Pick a stack (Node/Express, NestJS, Django, etc.), scaffold it into this
folder as its own app with its own `package.json` (or equivalent) and
lockfile — same pattern as `frontend/`, no shared workspace. Once it exists:

1. Add a `backend/CLAUDE.md` documenting its structure and conventions.
2. Wire its lint/format commands into the root `lint-staged` config in
   [../package.json](../package.json), the same way `frontend/**` is wired.
3. Update the root [README.md](../README.md) and [CLAUDE.md](../CLAUDE.md)
   architecture sections to describe the real stack.
