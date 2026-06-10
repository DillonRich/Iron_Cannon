#!/usr/bin/env node
/**
 * Run a range of knowledge waves then full audit gates.
 * Usage: node run-knowledge-waves-batch.mjs <from> <to>
 */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const from = Number(process.argv[2] ?? 69);
const to = Number(process.argv[3] ?? 75);

for (let w = from; w <= to; w += 1) {
  console.log(`\n========== WAVE ${w} ==========\n`);
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/run-knowledge-wave.mjs'), String(w)], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(1);
}

const gates = [
  'build:worker-bundle',
  'planning:stretch-test',
  'g2:adversarial-agent',
  'g2:production-confidence',
  'g2:obligation-coverage',
  'g2:audit',
];

for (const g of gates) {
  console.log(`\n--- gate: ${g} ---\n`);
  const r = spawnSync('npm', ['run', g], { cwd: ROOT, encoding: 'utf8', shell: true, stdio: 'inherit' });
  if (r.status !== 0) process.exit(1);
}

console.log(`\n✓ Waves ${from}–${to} batch complete — all gates green`);
