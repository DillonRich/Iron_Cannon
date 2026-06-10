#!/usr/bin/env node
/**
 * G-2 quality audit — no silent failures.
 * Fails loudly with non-zero exit if any suite fails.
 */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;

const suites = [
  { name: 'g2:test', cmd: ['run', 'g2:test'] },
  { name: 'g2:t05-all', cmd: ['run', 'g2:t05-all'] },
  { name: 'g2:tools-list', cmd: ['run', 'g2:tools-list'] },
  { name: 'g2:errors', cmd: ['run', 'g2:errors'] },
  { name: 'g2:sequence', cmd: ['run', 'g2:sequence'] },
  { name: 'g2:retrieval', cmd: ['run', 'g2:retrieval'] },
  { name: 'g2:e2e', cmd: ['run', 'g2:e2e'] },
  { name: 'g2:rate-limit', cmd: ['run', 'g2:rate-limit'] },
  { name: 'g2:golden-protocol', cmd: ['run', 'g2:golden-protocol'] },
  { name: 'g2:http', cmd: ['run', 'g2:http'] },
  { name: 'lint:planning-packages', cmd: ['run', 'lint:planning-packages'] },
  { name: 'planning:regression', cmd: ['run', 'planning:regression'] },
  { name: 'planning:gap-register', cmd: ['run', 'planning:wave55'] },
];

const failed = [];

for (const s of suites) {
  const r = spawnSync('npm', s.cmd, { cwd: ROOT, encoding: 'utf8', shell: true });
  if (r.status !== 0) {
    failed.push({
      name: s.name,
      status: r.status,
      stderr: (r.stderr || r.stdout || '').slice(-2000),
    });
    console.error(`✗ ${s.name} failed (exit ${r.status})`);
  } else {
    console.log(`✓ ${s.name}`);
  }
}

if (failed.length) {
  console.error('\n=== G-2 AUDIT FAILED ===');
  for (const f of failed) {
    console.error(`\n--- ${f.name} ---\n${f.stderr}`);
  }
  process.exit(1);
}

console.log('\n✓ G-2 audit — all suites pass');
process.exit(0);
