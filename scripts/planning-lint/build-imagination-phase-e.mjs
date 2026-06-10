#!/usr/bin/env node
/** Phase E — obligation-eval harness + compose-tier + EM-3 gate scenarios */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const reg = JSON.parse(readFileSync(regPath, 'utf8'));

let n =
  Math.max(
    0,
    ...reg.scenarios.map((s) => parseInt(String(s.id).replace('IMG-', ''), 10) || 0),
  ) + 1;
const added = [];

function push(s) {
  if (reg.scenarios.some((x) => x.id === s.id)) return;
  added.push(s);
  reg.scenarios.push(s);
}

for (const s of reg.scenarios) {
  if (s.harness === 'obligation' && s.obligationId) {
    s.harness = 'obligation-eval';
    s.minPassRate = 1;
  }
}

const phaseE = [
  { id: `IMG-${n++}`, name: 'Compose tier Pro strips legal', harness: 'compose-tier', tier: 'pro' },
  { id: `IMG-${n++}`, name: 'Compose tier Armor strips L4', harness: 'compose-tier', tier: 'armor' },
  { id: `IMG-${n++}`, name: 'Compose tier IronClad keeps L4', harness: 'compose-tier', tier: 'ironclad' },
  { id: `IMG-${n++}`, name: 'EM-3 touchpoint floor', harness: 'em3-floor', minTouchpoints: 1500 },
  { id: `IMG-${n++}`, name: 'Scale-B harvest queue SSOT', harness: 'doc', path: 'docs/engine/planning/scale-b-harvest-queue.json' },
  { id: `IMG-${n++}`, name: 'Agent directive templates', harness: 'doc', path: 'docs/engine/planning/agent-directive-templates.json' },
  { id: `IMG-${n++}`, name: 'EM-4 CH-026 billing race', harness: 'em4-conflict', conflictId: 'CH-026' },
  { id: `IMG-${n++}`, name: 'EM-4 CH-028 pro EM-3 block', harness: 'em4-conflict', conflictId: 'CH-028' },
];

for (const s of phaseE) push(s);

reg.scenarioCount = reg.scenarios.length;
reg.phaseECount = added.length;
reg.obligationEvalCount = reg.scenarios.filter((s) => s.harness === 'obligation-eval').length;

writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(
  `✓ Imagination Phase E — +${added.length} scenarios, ${reg.obligationEvalCount} obligation-eval (total ${reg.scenarioCount})`,
);
