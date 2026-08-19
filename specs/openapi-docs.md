# Spec: OpenAPI generation + Swagger UI

## Context

The `documentation` skill establishes the convention: derive the OpenAPI
spec from the same Zod schemas used for runtime validation
(`@asteasolutions/zod-to-openapi`), serve Swagger UI at `GET /docs`, and
write the generated `openapi.json` to the gitignored `.docs/swagger/` via
`docs:generate`. The wiring is not installed in this template yet.

## Goal

1. Add `@asteasolutions/zod-to-openapi` + `swagger-ui-express` (dev/runtime
   as appropriate) and a `src/openapi.ts` that registers route schemas.
2. Serve Swagger UI at `GET /docs` (non-production only, or behind
   `requireAuth` — decide and document).
3. Extend `docs:generate` to also export `.docs/swagger/openapi.json`.
4. Convert the starter routes (`/example`, `/users`) to registered schemas
   as the demonstration.

## Acceptance criteria

- [ ] `GET /docs` renders; the exported spec validates.
- [ ] Route Zod schemas are the single source (no hand-written spec blocks).
- [ ] Documentation skill's OpenAPI rule file matches what's installed.
