#!/usr/bin/env node
/** Append Phase 2 production-confidence adversarial scenarios (wave 64) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/production-confidence-scenarios.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.scenarios.map((s) => s.id));

const ADDED = [
  { id: 'PC-021', name: 'Context insufficient without wiremap', category: 'adversarial', harness: 'integration-error', trigger: { wiremapContext: null }, expect: 'CONTEXT_INSUFFICIENT' },
  { id: 'PC-022', name: 'Compliance failed zero patterns', category: 'adversarial', harness: 'integration-error', trigger: { patternsMatched: 0 }, expect: 'COMPLIANCE_FAILED' },
  { id: 'PC-023', name: 'Diff drift detected', category: 'adversarial', harness: 'integration-error', trigger: { hashDrift: true }, expect: 'DIFF_DRIFT_DETECTED' },
  { id: 'PC-024', name: 'Remote unavailable', category: 'adversarial', harness: 'integration-error', trigger: { network: 'down' }, expect: 'REMOTE_UNAVAILABLE' },
  { id: 'PC-025', name: 'Ruleset deprecated', category: 'adversarial', harness: 'integration-error', trigger: { rulesetVersion: '2020.01.01' }, expect: 'RULESET_DEPRECATED' },
  { id: 'PC-026', name: 'Stack incomplete missing config', category: 'adversarial', harness: 'integration-error', trigger: { missingConfig: ['stripe_webhook_secret'] }, expect: 'STACK_INCOMPLETE' },
  { id: 'PC-027', name: 'Auth missing API key', category: 'tier-churn', harness: 'integration-error', trigger: { apiKey: '' }, expect: 'AUTH_MISSING' },
  { id: 'PC-028', name: 'Security protocols 750+ active', category: 'adversarial', harness: 'security-protocols-floor', minActive: 750 },
  { id: 'PC-029', name: 'Retrieval baseline 120+ queries', category: 'adversarial', harness: 'retrieval-floor', minQueries: 120 },
  { id: 'PC-030', name: 'Obligation floor 150+', category: 'adversarial', harness: 'obligations-floor', minObligations: 150 },
];

for (const s of ADDED) {
  if (!existing.has(s.id)) reg.scenarios.push(s);
}
// Bump existing floors
for (const s of reg.scenarios) {
  if (s.id === 'PC-019') s.minObligations = 150;
  if (s.id === 'PC-020') s.minScenarios = 1200;
}
reg.version = '1.1.0';
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Production-confidence wave64 — ${reg.scenarios.length} scenarios`);
