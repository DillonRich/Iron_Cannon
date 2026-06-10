#!/usr/bin/env node
/** Operator dogfood bundle — pre-CF exhaust without credentials. */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const LINT = join(ROOT, 'scripts/planning-lint');

const scripts = [
  'simulate-dogfood-prep.mjs',
  'simulate-dogfood-live.mjs',
  'validate-g39-dogfood-live.mjs',
];

const failures = [];
for (const s of scripts) {
  const env = { ...process.env, IRON_CANNON_SKIP_HTTP: '1' };
  const r = spawnSync(process.execPath, [join(LINT, s)], { cwd: ROOT, encoding: 'utf8', env });
  if (r.status !== 0) {
    failures.push(`${s} failed:\n${(r.stdout ?? '') + (r.stderr ?? '')}`.slice(-500));
  }
}

const uj = spawnSync(
  process.execPath,
  [join(LINT, 'simulate-user-journey-behavioral.mjs')],
  { cwd: ROOT, encoding: 'utf8' },
);
if (uj.status !== 0) {
  failures.push(`user journeys failed:\n${(uj.stdout ?? '') + (uj.stderr ?? '')}`.slice(-500));
}

if (failures.length) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}

console.log('✓ Operator dogfood bundle — prep + live + UJ-111–115 green');
process.exit(0);
