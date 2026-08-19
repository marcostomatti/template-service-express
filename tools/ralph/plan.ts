#!/usr/bin/env bun

/**
 * ralph plan — generate a plan (and prerequisites) from a spec.
 *
 *   bun tools/ralph/ralph.ts plan --spec=specs/my-feature.md [--stub=my-feature]
 *
 * Reads the spec, wraps it in the plan-generation instructions
 * (plan-prompt.md — the dev-planner format contract), and hands it to a
 * Claude Code session that writes:
 *
 *   PLAN-<stub>.md            the flat checklist + technical context
 *   PREREQUISITES-<stub>.md   non-automatable setup steps (only if any)
 *
 * The stub defaults to the spec's basename. Execute the result with:
 *
 *   bun tools/ralph/ralph.ts start --plan=PLAN-<stub>.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { checkUsage, runClaude } from './utils/claude.js';
import { getRepoRoot } from './utils/git.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function argValue(args: string[], flag: string): string | undefined {
  const hit = args.find((a) => a.startsWith(`${flag}=`));
  return hit?.slice(flag.length + 1);
}

/** Builds the full plan-generation prompt. Exported for tests. */
export function buildPlanPrompt(template: string, specContent: string, stub: string): string {
  return template
    .replaceAll('{PLAN_FILE}', `PLAN-${stub}.md`)
    .replaceAll('{PREREQUISITES_FILE}', `PREREQUISITES-${stub}.md`)
    .replaceAll('{SPEC_CONTENT}', specContent);
}

/** Derives the plan stub from a spec path: specs/my-feature.md → my-feature. */
export function stubFromSpecPath(specPath: string): string {
  return path.basename(specPath).replace(/\.md$/, '');
}

export default async function plan(args: string[]): Promise<void> {
  const repoRoot = getRepoRoot();

  const specArg = argValue(args, '--spec');
  if (!specArg) {
    console.error('Usage: ralph plan --spec=specs/<spec-file>.md [--stub=<name>]');
    process.exit(1);
  }

  const specPath = path.resolve(repoRoot, specArg);
  if (!fs.existsSync(specPath)) {
    console.error(`❌ Spec file not found: ${specPath}`);
    process.exit(1);
  }

  const stub = argValue(args, '--stub') ?? stubFromSpecPath(specPath);
  const planPath = path.join(repoRoot, `PLAN-${stub}.md`);
  if (fs.existsSync(planPath)) {
    console.error(`❌ ${path.basename(planPath)} already exists — remove it or pass a different --stub.`);
    process.exit(1);
  }

  await checkUsage('issue');

  const template = fs.readFileSync(path.join(__dirname, 'plan-prompt.md'), 'utf8');
  const specContent = fs.readFileSync(specPath, 'utf8');
  const prompt = buildPlanPrompt(template, specContent, stub);

  console.log(`📝 Generating PLAN-${stub}.md from ${path.basename(specPath)}...`);
  const exitCode = await runClaude(prompt);

  if (exitCode !== 0) {
    console.error(`\n❌ Plan generation failed (exit ${exitCode}).`);
    process.exit(exitCode);
  }

  if (!fs.existsSync(planPath)) {
    console.error(`\n❌ The session finished but ${path.basename(planPath)} was not created — inspect the output above.`);
    process.exit(1);
  }

  console.log(`\n✅ Plan ready: ${path.basename(planPath)}`);
  const prereqPath = path.join(repoRoot, `PREREQUISITES-${stub}.md`);
  if (fs.existsSync(prereqPath)) {
    console.log(`⚠️  Prerequisites detected: complete ${path.basename(prereqPath)} before starting the loop.`);
  }
  console.log(`▶ Execute with: bun tools/ralph/ralph.ts start --plan=PLAN-${stub}.md`);
}
