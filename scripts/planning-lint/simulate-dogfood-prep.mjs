#!/usr/bin/env node
/** Pre-launch dogfood prep — T01 baselines on monorepo without requiring SD-01 fit. */
import { invokeTool } from './lib/mcp-invoke.mjs';
import { REPO_ROOT, MCP_WORKER_DIR } from './lib/iron-cannon-repo.mjs';
import { REFERENCE_APP_DIR } from './lib/golden-reference-app-modules.mjs';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const signoff = join(ROOT, 'docs/engine/PRE_LAUNCH_DOGFOOD_SIGNOFF.md');
if (!existsSync(signoff)) failures.push('missing PRE_LAUNCH_DOGFOOD_SIGNOFF.md');

const plan = readFileSync(join(ROOT, 'docs/engine/PRE_LAUNCH_DOGFOOD_PLAN.md'), 'utf8');
if (!plan.includes('G-39')) failures.push('PRE_LAUNCH_DOGFOOD_PLAN missing G-39');

const rootT01 = await invokeTool('T01', { projectPath: REPO_ROOT, tier: 'pro' });
if (!rootT01.ok) failures.push('T01 repo root failed');
if (rootT01.stack?.supported !== false) failures.push('T01 repo root should be supported:false (meta monorepo)');

const workerT01 = await invokeTool('T01', { projectPath: MCP_WORKER_DIR, tier: 'pro' });
if (!workerT01.ok) failures.push('T01 mcp-worker failed');
if (workerT01.stack?.compute !== 'cloudflare_workers') {
  failures.push(`T01 mcp-worker compute want cloudflare_workers, got ${workerT01.stack?.compute}`);
}

const refT01 = await invokeTool('T01', { projectPath: REFERENCE_APP_DIR, tier: 'pro' });
if (!refT01.stack?.supported) failures.push('golden reference app must remain supported:true');

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
const prep = uj.scenarios.filter((s) => s.id >= 'UJ-091' && s.id <= 'UJ-095');
if (prep.length < 5) failures.push(`dogfood prep journeys: ${prep.length} < 5`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Dogfood prep — root/worker T01 baselines OK, ${prep.length} UJ-091–095`);
process.exit(0);
