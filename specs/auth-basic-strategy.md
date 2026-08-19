# Spec: basic authentication strategy (replace the introspection stub)

## Context

The framework's auth middleware (`lib/express/auth.ts`) is already fully
wired for bearer tokens: `requireAuth`/`optionalAuth` forward the caller's
token to an RFC 7662 `POST /introspect` endpoint and attach the returned
claims to `res.locals.auth`, failing closed on any error. The seam is
`SessionVerifier` — swap the verifier, keep the middleware.

What's missing is the backend. Today `src/auth/stub.ts` serves a
development-only introspection endpoint that accepts a single static token.

## Goal

A minimal, self-contained basic-auth strategy:

1. **Bootstrap credentials from `.env`**: `AUTH_BASIC_USER` and
   `AUTH_BASIC_PASSWORD` define the initial (admin) user. On service start —
   right after migrations run — upsert that user into an `auth_users` table
   (password stored as a salted hash, argon2id or bcrypt; never plaintext).
2. **Token issuance**: `POST /auth/login` with `{ user, password }` verifies
   against the table and returns an opaque session token persisted in an
   `auth_sessions` table (token hash, `sub`, `created_at`, `expires_at`).
3. **Introspection backed by the DB**: implement a `SessionVerifier` (or the
   `/introspect` endpoint itself) that looks the token up, checks expiry, and
   returns `{ active: true, sub }` — so the existing middleware keeps working
   unchanged, including for sibling services pointing at this one.
4. **Logout/rotation**: `POST /auth/logout` revokes the session row.
5. Delete `src/auth/stub.ts` once the strategy lands.

## Non-goals

- OIDC/OAuth flows (planned as a later module — design the login route so a
  provider-based flow can sit beside it).
- Password reset, MFA, account management UI.
- Multi-tenant users/roles — single table, single role, keep it flat.

## Acceptance criteria

- [ ] `bun run test` covers: login happy path, wrong password, expired
      session, revoked session, introspection contract (`active`/`sub`),
      and that the bootstrap upsert is idempotent across restarts.
- [ ] A live test in `tests/live/` proves the session round-trip against
      real Postgres (migrations, not schema push).
- [ ] `AUTH_BASIC_PASSWORD` never appears in logs; the hash column never
      leaves the auth module.
- [ ] `.env.example` documents the new variables; README's auth section is
      updated; `specs/README.md` row is checked off.
