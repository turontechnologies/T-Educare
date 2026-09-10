# T-Educare — Backend

Not yet scaffolded. This folder is reserved for the API service the
[frontend](../frontend) talks to via `NEXT_PUBLIC_API_URL`
(see `frontend/src/lib/axios.ts`).

The frontend is already deployed and live at
**https://t-educare.vercel.app/** (Vercel), alongside local dev at
`http://localhost:3000` — whatever stack this backend ends up using needs
CORS open to both. See [API_CONTRACT.md § Deployment](./API_CONTRACT.md#deployment)
for details.

## Expected contract

See **[API_CONTRACT.md](./API_CONTRACT.md)** for the full spec — auth, the
institution/role/permission (RBAC) model, and every resource the frontend
currently calls (mocked client-side for now). Keep it updated as new
frontend pages land; it's written to track `frontend/src/config/nav.ts` and
the mocked `src/store/*.ts` files 1:1.

## Setting this up

Pick a stack (Node/Express, NestJS, Django, etc.), scaffold it into this
folder as its own app with its own `package.json` (or equivalent) and
lockfile — same pattern as `frontend/`, no shared workspace. Once it exists:

1. Add a `backend/CLAUDE.md` documenting its structure and conventions.
2. Wire its lint/format commands into the root `lint-staged` config in
   [../package.json](../package.json), the same way `frontend/**` is wired.
3. Update the root [README.md](../README.md) and [CLAUDE.md](../CLAUDE.md)
   architecture sections to describe the real stack.
