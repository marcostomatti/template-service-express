# Specs index

Follow-up work identified during the extraction that exceeds the
copy/rename/trim scope of the initial port. One file per spec; feed one to
the loop with `bun run ralph plan --spec=specs/<file>.md`.

| Spec | What it covers | Why it's deferred |
| --- | --- | --- |
| [auth-basic-strategy.md](auth-basic-strategy.md) | Replace the dev introspection stub with a real basic-auth strategy (user/password from `.env` → token, created right after migration) | Auth backend scope exceeds the balance of the initial port; middleware is already token-wired |
| [dependency-updates.md](dependency-updates.md) | Major-version catch-up (`bun outdated`) + automated bump cadence (Dependabot/Renovate) | Needs its own test-gated pass; majors (Express 5, Zod 4) have breaking changes |
| [test-type-checking.md](test-type-checking.md) | Include `*.test.ts` in `tsc --noEmit` and burn down the resulting errors | Origin packages never type-checked tests; ~13 pre-existing errors to fix |
| [control-plane-hardening.md](control-plane-hardening.md) | Harden `/_control`: timing-safe token compare, make `POST /stop` separately opt-in, version-read cwd caveat | Self-contained operator surface works today; sharp edges documented, not fixed |
| [multi-plan-queue.md](multi-plan-queue.md) | A `ralph queue` successor to the origin's multi-issue loop, without tracker/webhook coupling | The origin implementation was coupled to an external tracker + workflow webhook (dropped by design) |
| [openapi-docs.md](openapi-docs.md) | OpenAPI generation from the Zod route schemas + Swagger UI at `GET /docs` | Convention documented in the `documentation` skill; wiring not installed yet |
