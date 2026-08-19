# Spec: harden the `/_control` operator plane

## Context

`lib/express/control/` is a per-process operator surface (status,
dependency pause/resume/restart, client reset, stop), mounted only when
`config.control` is present and gated by a static `x-control-token` header.
It is self-contained and useful, but three sharp edges came over with it:

1. The token compare is `!==` — not timing-safe.
2. `POST /stop` kills the process from an HTTP route behind the same static
   string as the read-only endpoints.
3. `readServiceVersion()` reads `process.cwd()/package.json`, so version
   reporting depends on the working directory at startup.
4. (Cosmetic) `isRestartableDependency` is a tautology — `stop`/`start` are
   required on `Dependency`, so it always returns true.

## Goal

- Compare control tokens with `crypto.timingSafeEqual` over fixed-length
  digests.
- Split `POST /stop` behind its own opt-in flag (`control.allowStop`),
  default off.
- Resolve the version path relative to the entrypoint (or accept it in
  config) instead of cwd.
- Either implement a real capability check for restartable dependencies or
  remove the tautological guard.

## Acceptance criteria

- [ ] Control route tests cover the timing-safe compare (equal/unequal
      lengths) and the `/stop` opt-in default-off behaviour.
- [ ] `bun run test` green; control docs in AGENTS.md updated.
