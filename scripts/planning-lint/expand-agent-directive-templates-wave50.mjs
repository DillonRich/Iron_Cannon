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
    templateId: 'DIR-RETRIEVAL-001',
    phase: 'COMPOSE',
    tierMin: 'pro',
    agentMust: ['Calibrate retrieval baseline after corpus index rebuild', 'Prefer top-3 ref overlap SSOT'],
    agentMustNot: ['Hard-code expectedRefIds without calibrate-retrieval-baseline.mjs'],
  },
  {
    templateId: 'DIR-QUALITY-001',
    phase: 'MONITOR',
    tierMin: 'pro',
    agentMust: ['Run planning:regression and lint:all before closing planning session'],
    agentMustNot: ['Ship planning wave with failing per-flow protocol ids'],
  },
];

for (const t of added) {
  if (!existing.has(t.templateId)) reg.templates.push(t);
}
reg.templateCount = reg.templates.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Agent directive templates wave 50 — ${reg.templateCount} total`);
