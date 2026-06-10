#!/usr/bin/env node
/**
 * G-2 production-confidence orchestrator (Phase 2).
 * Runs planning harness + selected runtime smokes that do not require live deploy.
 */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;

const suites = [
  { name: 'production-confidence-planning', script: 'planning-lint/simulate-production-confidence.mjs' },
  { name: 'adversarial-agent-planning', script: 'planning-lint/simulate-adversarial-agent.mjs' },
  { name: 'user-journey-behavioral', script: 'planning-lint/simulate-user-journey-behavioral.mjs' },
  { name: 'g2:subscription', cmd: ['run', 'g2:subscription'] },
  { name: 'g2:throttle', cmd: ['run', 'g2:throttle'] },
  { name: 'g2:golden-full', cmd: ['run', 'g2:golden-full'] },
];

const failed = [];

for (const s of suites) {
  let ok = false;
  if (s.script) {
    const r = spawnSync(node, [join(ROOT, 'scripts', s.script)], { cwd: ROOT, encoding: 'utf8' });
    ok = r.status === 0;
    if (!ok) failed.push({ name: s.name, stderr: (r.stderr || r.stdout || '').slice(-2000) });
  } else {
    const r = spawnSync('npm', s.cmd, { cwd: ROOT, encoding: 'utf8', shell: true });
    ok = r.status === 0;
    if (!ok) failed.push({ name: s.name, stderr: (r.stderr || r.stdout || '').slice(-2000) });
  }
  console.log(ok ? `✓ ${s.name}` : `✗ ${s.name} failed`);
}

if (failed.length) {
  console.error('\n=== G-2 PRODUCTION-CONFIDENCE FAILED ===');
  for (const f of failed) console.error(`\n--- ${f.name} ---\n${f.stderr}`);
  process.exit(1);
}

console.log('\n✓ G-2 production-confidence — all suites pass');
process.exit(0);
