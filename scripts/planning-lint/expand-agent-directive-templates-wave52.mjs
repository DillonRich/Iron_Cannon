#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/agent-directive-templates.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.templates.map((t) => t.templateId));

const added = [
  {
    templateId: 'DIR-SRE-001',
    phase: 'MONITOR',
    tierMin: 'armor',
    agentMust: ['Complete EM-1 SRE lattice step before production gate', 'Document runbook link in state_log'],
    agentMustNot: ['Skip DRILL phase on billing webhook modules'],
  },
  {
    templateId: 'DIR-CHAOS-001',
    phase: 'TEST',
    tierMin: 'armor',
    agentMust: ['Run CHAOS lattice checkpoint on auth and billing paths in preview'],
    agentMustNot: ['Run chaos tests against production Stripe live mode'],
  },
];

for (const t of added) {
  if (!existing.has(t.templateId)) reg.templates.push(t);
}
reg.templateCount = reg.templates.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Agent directive templates wave 52 — ${reg.templateCount} total`);
