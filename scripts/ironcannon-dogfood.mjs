#!/usr/bin/env node
/**
 * One-shot Guardian-style dogfood: audit + fixture retest + optional HTTP smoke (G-62).
 * Usage: npm run ironcannon:dogfood -- "C:/path/to/project"
 */
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectPath = process.argv[2] ?? process.env.IRON_CANNON_PROJECT_PATH;

if (!projectPath) {
  console.error('Usage: npm run ironcannon:dogfood -- "C:/path/to/your-app"');
  process.exit(1);
}
if (!existsSync(projectPath)) {
  console.error(`Project path not found: ${projectPath}`);
  process.exit(1);
}

function run(label, args) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit', shell: false });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed (exit ${r.status ?? 1})`);
    process.exit(r.status ?? 1);
  }
}

run('ironcannon audit', [join(ROOT, 'scripts/ironcannon.mjs'), 'audit', projectPath, '--write-state-log']);
run('planning:guardian-retest', [join(ROOT, 'scripts/planning-lint/simulate-guardian-equivalence.mjs')]);
run('g2:mcp-envelope', [join(ROOT, 'scripts/g2-mcp-content-envelope.mjs')]);

const http = spawnSync(process.execPath, [join(ROOT, 'scripts/g2-http-smoke.mjs')], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: false,
});
if (http.status !== 0) {
  console.log('⊘ g2:http skipped or failed — start `npm run ironcannon:serve` for full HTTP smoke');
}

console.log('\n✓ ironcannon:dogfood complete — audit + guardian-retest + MCP envelope');
process.exit(0);
