# Spec: type-check the test files

## Context

`tsconfig.json` excludes `**/*.test.ts` from `tsc --noEmit`. This is origin
parity — the source packages never type-checked their tests — but it means
the matcher/type surface of tests silently drifts. At extraction time the
exclusion hides ~13 pre-existing errors: `noUncheckedIndexedAccess`
violations in `lib/errors/__tests__/handler.test.ts`, two pino type casts in
`lib/logger/__tests__/node.test.ts`, vitest `Mock` signature mismatches in
`lib/mcp/__tests__/createMCP.test.ts`, and two issues in
`lib/mcp/__tests__/types.test.ts`.

## Goal

Remove `**/*.test.ts` from the tsconfig `exclude` and fix every resulting
error — with real narrowing (`?.`, explicit type params on `vi.fn`), not
`any` or blanket `@ts-expect-error`.

## Acceptance criteria

- [ ] `bun run check-types` passes with test files included.
- [ ] No new `any` casts; `as unknown as` only where a test genuinely
      erases a type on purpose (document each).
- [ ] The tsconfig comment about the exclusion is removed.
