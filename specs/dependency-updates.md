# Spec: dependency version catch-up + automated bump cadence

## Context

The extracted stack inherited the origin's pins, and `bun outdated` shows the
majors drifting. Known laggards at extraction time (2026-08): Express 4
(5 is current), Zod 3 (4 is current), Helmet 7, cookie-parser 1.4 line,
`@types/express` 4. None block the template, but the gap compounds.

Two known landmines documented in `lib/express`'s conventions:

- **Express 5** auto-forwards errors thrown from async route handlers;
  Express 4 does not — `lib/express/control/routes.ts` wraps every async
  handler in explicit try/catch. Upgrading allows relaxing that convention,
  but do not drop it silently while on 4.
- **Zod 4** changes error/issue shapes that `lib/errors/handler.ts`
  (`zodToValidationError`) and every route schema depend on.

## Goal

1. A one-time catch-up pass: bump each major individually, run the full gate
   (`lint`, `check-types`, `test`, plus `test:live` where the dependency
   touches persistence), and land each as its own PR.
2. Automated cadence: enable Dependabot (or Renovate) with
   - weekly or biweekly `npm` ecosystem updates,
   - grouped minor/patch bumps, individual PRs for majors,
   - the existing `test.yml` workflow as the gate.
   Dependabot config lives at `.github/dependabot.yml` and is free for
   public and private repos on GitHub-hosted runners.

## Acceptance criteria

- [ ] `.github/dependabot.yml` exists and opens PRs on schedule.
- [ ] Express 5 and Zod 4 upgrades either landed or have a written blocker
      note in this file.
- [ ] Every bump PR shows the test workflow green before merge.
