#!/usr/bin/env node
/** G-39 automated dogfood live — wraps simulate-dogfood-live.mjs for stretch suite. */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const r = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/simulate-dogfood-live.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, IRON_CANNON_SKIP_HTTP: '1' },
});

if (r.status !== 0) {
  process.stderr.write((r.stdout ?? '') + (r.stderr ?? ''));
  process.exit(r.status ?? 1);
}

console.log('✓ G-39 dogfood live — automated monorepo exhaust');
process.exit(0);
