# AGENTS — template-service-express

Standalone Express + MCP service template. Single package, bun-first, no
workspace. Read this before changing anything; the per-area conventions live
in `.claude/skills/` and are pointed to below.

## Layout

| Path | What it is |
| --- | --- |
| `lib/` | The framework: `express` (createService: DI, middleware, health, `/_control`, auth middleware, shutdown), `service-core` (dependencies, typed clients, circuit breaker, retry, http client), `mcp` (createMCP: stdio/HTTP transports + health), `logger` (pino), `errors` (AppError family + the error handler createService registers). Treat as library code — stable, well-tested, changed deliberately. |
| `src/` | The service: `config.ts` (zod env, fail-fast), `routes/`, `db/` (Drizzle+Postgres, default on), `redis/` (opt-in via `REDIS_URL`), `cron/` (interval jobs as a managed dependency), `notifications/` (preference-aware dispatch + channel stubs), `auth/` (dev introspection stub), `mcp/` (MCP entry + tools). |
| `tools/ralph/` | The agent task loop: `plan` (spec → PLAN/PREREQUISITES), `start` (tracker loop, `--plan`, `--start-at`), `usage`. |
| `tests/` | Cross-cutting tests; `tests/live/` is the live suite (see Testing). Package-level tests are colocated (`lib/**/__tests__`, `src/**/*.test.ts`). |
| `specs/` | Follow-up specs + index (`specs/README.md`). Feed one to `bun run ralph plan --spec=…`. |
| `docs/` | Tracked guides (drizzle, rpc, sse). Generated output goes to gitignored `.docs/` (`bun run docs:generate`). |

## Conventions

- **Env**: all configuration through `src/config.ts` — zod-validated at
  import, `import process from 'node:process'` (bare `process` fails lint).
- **Dependencies**: anything with a lifecycle (db, redis, cron, future
  queues) is a `createDependency` passed to `createService({ dependencies })`
  — started in order, stopped in reverse, visible to `/_control`.
- **Errors**: throw `AppError` subclasses (`lib/errors`) or let Zod errors
  bubble — the registered handler maps them to typed JSON responses. Express
  4 does NOT auto-forward async route errors: wrap async handlers in
  try/catch + `next(err)` (see `src/index.ts` `/users`).
- **Routes**: validate input at the boundary with zod (see the `api` skill).
- **Docs**: TSDoc on exported surfaces; see the `documentation` skill.

## Verification order

```bash
bun run lint && bun run check-types && bun run test
```

All three must be green before a PR. `check-types` currently excludes
`**/*.test.ts` (origin parity — see `specs/test-type-checking.md`).

## Testing — isolated vs live (CRITICAL)

The default suite is FULLY ISOLATED: no db, no network, no credentials.
Keep it that way — a past incident where tests ran against live
infrastructure with real credentials burned a month of tokens in under an
hour. The rules:

1. New tests mock or fake external systems by default. If a fake gets
   nontrivial, give the fake its own contract tests.
2. Live tests go in `tests/live/*.live.test.ts`, gated through
   `describeLivePg` (env-var opt-in → `describe.skip` otherwise; keep the
   explicit type annotation — inference breaks `tsc` with TS2742).
3. Live tests run only against the `--profile stress` compose services
   (`bun run stress:start / test:live / stress:stop`) — separate port,
   separate database name, no volume.
4. Destructive helpers must call `assertLiveDatabase` (refuses any database
   but `template_live`). Never widen the truncate list implicitly.
5. Clean up after live runs: `stress:stop` removes only the stress
   containers. Leave no long-lived processes or scheduled jobs behind.
6. `fileParallelism: false` lives in `vitest.config.ts`, not on a script
   flag, so exported env vars can't re-parallelize the live files.

## The loop

`bun run ralph plan --spec=specs/<file>.md` writes `PLAN-<stub>.md`
(+ `PREREQUISITES-<stub>.md` when needed) per the `dev-planner` skill;
`bun run ralph start --plan=PLAN-<stub>.md` executes it task-by-task with a
per-plan tracker (`PLAN_TRACKER-<stub>.md`), marking `[x]`/`[BLOCKED]` and
resuming blocked tasks first. `--start-at=HH:MM` defers a run. On
completion the loop extracts general findings from `progress.txt` into the
repo docs and opens a PR.

## Issue reporting

The `qa-bug-reporter` agent files findings as GitHub issues via `gh`
(dedupes first, never guesses priority, asks before filing). Security
findings are routed to a private security advisory by a human — never to the
public tracker, and never searched for on it first.

## Workflow

Feature-branch → PR → merge. `test.yml` gates PRs with the isolated suite
only. Integration/live testing is a local (or self-hosted-runner) concern by
design.
