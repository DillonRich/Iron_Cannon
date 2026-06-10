#!/usr/bin/env node
/** Operator preflight bundle — readiness + dogfood + stripe + affiliates (no credentials). */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const LINT = join(ROOT, 'scripts/planning-lint');

const scripts = [
  'validate-operator-deploy-readiness.mjs',
  'simulate-dogfood-prep.mjs',
  'simulate-stripe-prep.mjs',
  'simulate-affiliates-prep.mjs',
];

const failures = [];
for (const s of scripts) {
  const r = spawnSync(process.execPath, [join(LINT, s)], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    failures.push(`${s} failed:\n${(r.stdout ?? '') + (r.stderr ?? '')}`.slice(-500));
  }
}

if (failures.length) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}

console.log(`✓ Operator preflight bundle — ${scripts.length} prep scripts green`);
process.exit(0);
