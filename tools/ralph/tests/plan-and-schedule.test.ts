/**
 * Tests for the merged loop's new pieces: per-plan tracker derivation,
 * --start-at time math, and plan-prompt templating.
 */
import { describe, expect, it } from 'vitest';

import { buildPlanPrompt, stubFromSpecPath } from '../plan.js';
import { msUntil } from '../utils/schedule.js';
import { trackerPathFor } from '../utils/tracker.js';

describe('trackerPathFor', () => {
  it('maps the default plan to the default tracker', () => {
    expect(trackerPathFor('/repo/PLAN.md')).toBe('/repo/PLAN_TRACKER.md');
  });

  it('keeps the stub suffix so plans get independent trackers', () => {
    expect(trackerPathFor('/repo/PLAN-auth-basic.md')).toBe('/repo/PLAN_TRACKER-auth-basic.md');
  });
});

describe('msUntil', () => {
  it('computes the delay to a later time today', () => {
    const now = new Date('2026-08-19T10:00:00');
    expect(msUntil('10:30', now)).toBe(30 * 60_000);
  });

  it('rolls to tomorrow when the time already passed', () => {
    const now = new Date('2026-08-19T23:30:00');
    expect(msUntil('23:00', now)).toBe(23.5 * 60 * 60_000);
  });

  it('rejects malformed input', () => {
    expect(() => msUntil('9pm')).toThrow(/HH:MM/);
    expect(() => msUntil('25:00')).toThrow(/valid time/);
  });
});

describe('buildPlanPrompt', () => {
  it('substitutes plan, prerequisites, and spec placeholders', () => {
    const template = 'plan={PLAN_FILE} prereq={PREREQUISITES_FILE}\n---\n{SPEC_CONTENT}';
    const out = buildPlanPrompt(template, '# My spec', 'my-feature');
    expect(out).toContain('plan=PLAN-my-feature.md');
    expect(out).toContain('prereq=PREREQUISITES-my-feature.md');
    expect(out).toContain('# My spec');
    expect(out).not.toContain('{SPEC_CONTENT}');
  });
});

describe('stubFromSpecPath', () => {
  it('derives the stub from the spec basename', () => {
    expect(stubFromSpecPath('/repo/specs/auth-basic-strategy.md')).toBe('auth-basic-strategy');
  });
});
