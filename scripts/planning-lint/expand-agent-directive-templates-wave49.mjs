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
    templateId: 'DIR-TOOL-GATE-001',
    phase: 'TOOL_GATE',
    tierMin: 'pro',
    agentMust: ['Confirm prior tool succeeded before next MCP call', 'Log tool id in state_log'],
    agentMustNot: ['Skip T03 wiremap before T04 compose'],
  },
  {
    templateId: 'DIR-MONITOR-001',
    phase: 'MONITOR',
    tierMin: 'armor',
    agentMust: ['Enable structured logging without secrets', 'Alert on auth anomaly thresholds'],
    agentMustNot: ['Ship debug logging with PII to third parties'],
  },
  {
    templateId: 'DIR-OBSERVABILITY-001',
    phase: 'OBSERVABILITY',
    tierMin: 'armor',
    agentMust: ['Trace webhook and checkout flows end-to-end', 'Correlate stripe event id in logs'],
    agentMustNot: ['Rely on client-only success for billing'],
  },
  {
    templateId: 'DIR-MARKET-001',
    phase: 'COMPLIANCE',
    tierMin: 'ironclad',
    agentMust: ['Filter obligations by T01 projectMarkets', 'Apply jurisdiction bundle micro-stipulations'],
    agentMustNot: ['Apply EU-only cookie rules to US-only projects'],
  },
  {
    templateId: 'DIR-BUILD-001',
    phase: 'BUILD',
    tierMin: 'pro',
    agentMust: ['Match module rule specimen', 'Run T05 patternsUnderTest'],
    agentMustNot: ['Mark module complete with failing fixture'],
  },
  {
    templateId: 'DIR-ATTESTATION-001',
    phase: 'ATTESTATION',
    tierMin: 'pro',
    agentMust: ['Record attestation in state_log before next golden module'],
    agentMustNot: ['Auto-attest without human or explicit agent confirm'],
  },
  {
    templateId: 'DIR-SLICE-001',
    phase: 'COMPOSE',
    tierMin: 'pro',
    agentMust: ['Respect C14 token budget', 'Emit SLICE_TRUNCATED when overflow'],
    agentMustNot: ['Silently drop legal cards for Iron Clad tier'],
  },
];

for (const t of added) {
  if (!existing.has(t.templateId)) reg.templates.push(t);
}
reg.templateCount = reg.templates.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Agent directive templates — ${reg.templateCount} total`);
