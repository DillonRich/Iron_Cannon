#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/simulate-user-journey-behavioral.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (r.status !== 0) {
  console.error((r.stderr || r.stdout || '').slice(-4000));
  process.exit(1);
}
console.log('✓ G-2 user-journey behavioral — all journeys pass');
process.exit(0);
