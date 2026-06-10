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
    templateId: 'DIR-MARKET-FILTER-001',
    phase: 'COMPLIANCE',
    tierMin: 'ironclad',
    agentMust: ['Apply jurisdiction bundle for each T01 projectMarket', 'Skip obligations outside active markets'],
    agentMustNot: ['Compose EU-only cards for US-only projectMarkets'],
  },
  {
    templateId: 'DIR-INCIDENT-001',
    phase: 'INCIDENT',
    tierMin: 'armor',
    agentMust: ['Pause golden loop on COMPLIANCE_FAILED', 'Open EM-1 INCIDENT lattice step before resume'],
    agentMustNot: ['Auto-resume without rollback snapshot when webhook verify fails'],
  },
];

for (const t of added) {
  if (!existing.has(t.templateId)) reg.templates.push(t);
}
reg.templateCount = reg.templates.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Agent directive templates wave 51 — ${reg.templateCount} total`);
