#!/usr/bin/env node
/** G-2 adversarial agent smoke — planning harness (live agent loop deferred to deploy) */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/simulate-adversarial-agent.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});

if (r.status !== 0) {
  console.error((r.stderr || r.stdout || '').slice(-2000));
  process.exit(1);
}
console.log('✓ G-2 adversarial agent — planning harness pass');
process.exit(0);
