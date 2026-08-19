# Spec: `ralph queue` — sequential multi-plan execution

## Context

The origin stack had a multi-issue loop that fetched issue metadata from an
external tracker, called a workflow webhook to generate a plan branch, ran
the task loop per issue, and gated advancement on PR merges. The tracker and
webhook halves were dropped by design in this extraction; the loop mechanics
(a persisted queue with `pending/blocked/done` states, resume-from-blocked,
conflict detection on checkout, wait-for-merge between items) are generic
and worth rebuilding on top of what the template already has.

## Goal

`bun run ralph queue --specs=specs/a.md,specs/b.md` (or `--plans=…` for
pre-generated plans):

1. Persist queue state to `.tmp/ralph-queue.json`
   (`{ items: [{ spec, plan, status, branch? }], currentIndex }`).
2. Per item: create a branch (`feat/<stub>`), run `ralph plan` if given a
   spec, then `ralph start --plan=…`, then hand off to the existing
   preserve-progress step (PR creation).
3. Between items: wait for the PR merge (poll `gh pr view --json state`, or
   interactive confirm like the origin), checkout main, pull, continue.
4. SIGINT marks the current item blocked; re-running resumes it first.
5. Respect the usage guard (`checkUsage`) between items.

## Non-goals

- Any tracker integration beyond `gh` (labels/issues optional, not required).
- Parallel execution — the queue is sequential by design.

## Acceptance criteria

- [ ] Queue state survives interrupt + resume (unit-tested against a temp dir).
- [ ] A two-spec dry run (with `runClaude` mocked) walks the full state
      machine: plan → start → PR gate → next.
- [ ] Documented in README's ralph section.
