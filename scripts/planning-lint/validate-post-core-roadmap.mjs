#!/usr/bin/env node
/** Lint post–core MCP planning SSOT artifacts exist and service queue is valid. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const requiredDocs = [
  'docs/engine/POST_CORE_MCP_MASTER_ROADMAP.md',
  'docs/engine/STARTER_SCOPE_VALIDATION_PLAN.md',
  'docs/engine/STARTER_SCOPE_SIGNOFF.md',
  'docs/engine/SERVICE_EXPANSION_PLAYBOOK.md',
  'docs/engine/SERVICE_EXPANSION_CYCLE_SIGNOFF.md',
  'docs/engine/OPERATOR_DEPLOY_READINESS.md',
];

for (const rel of requiredDocs) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const queuePath = join(ROOT, 'docs/engine/planning/service-expansion-queue.json');
if (!existsSync(queuePath)) {
  failures.push('missing service-expansion-queue.json');
} else {
  const q = JSON.parse(readFileSync(queuePath, 'utf8'));
  if (!q.services?.length) failures.push('service-expansion-queue: empty services');
  const expandable = q.services.filter((s) => s.status === 'queued' || s.status === 'planning');
  const finished = q.services.filter((s) => s.status === 'complete');
  if (expandable.length < 1 && finished.length < 1) {
    failures.push('service-expansion-queue: need ≥1 queued/planning service or completed expansion');
  }
}

const grPath = join(ROOT, 'docs/engine/planning/gap-register.json');
if (existsSync(grPath)) {
  const gr = JSON.parse(readFileSync(grPath, 'utf8'));
  const okStage = ['starter-scope', 'service-expansion', 'continuous-improvement'].includes(gr.currentStage);
  if (!okStage) {
    failures.push(`gap-register currentStage unexpected: ${gr.currentStage}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

const q = JSON.parse(readFileSync(queuePath, 'utf8'));
console.log(
  `✓ Post-core roadmap — ${requiredDocs.length} docs, ${q.services.length} services in queue (stage starter-scope)`,
);
process.exit(0);
