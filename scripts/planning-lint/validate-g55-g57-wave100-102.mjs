#!/usr/bin/env node
/** G-55–G-57 harvest — MCP envelope, Tauri profile, T14 tiered readiness. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

for (const rel of [
  'packages/mcp-core/src/mcp-tool-result.js',
  'docs/engine/specimens/fixtures/stack-detection/tauri-desktop-supported.fixture-spec.json',
  'docs/engine/specimens/fixtures/modules/M80-tauri-app-config.fixture-spec.json',
]) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
for (const id of ['G-55', 'G-56', 'G-57']) {
  const g = gr.gaps.find((x) => x.id === id);
  if (!g || g.status !== 'closed') failures.push(`${id} must be closed`);
}

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
for (const id of ['UJ-120', 'UJ-121']) {
  if (!uj.scenarios.some((s) => s.id === id)) failures.push(`${id} missing`);
}

const runs = [
  ['g2-mcp-content-envelope.mjs', 'MCP envelope'],
  ['g2-t05-all-modules.mjs', 'T05 all modules'],
  ['planning-lint/simulate-guardian-equivalence.mjs', 'guardian retest'],
];

for (const [rel, label] of runs) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', rel)], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) failures.push(`${label} failed\n${r.stdout}\n${r.stderr}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ G-55–G-57 wave 100–102 — ${uj.scenarios.length} journeys, MCP envelope + tauri + T14 tiers`);
process.exit(0);
