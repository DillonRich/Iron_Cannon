#!/usr/bin/env node
/** Phase S — imagination floor 350+ (wave 53–54 stretch) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const reg = JSON.parse(readFileSync(regPath, 'utf8'));
let n = Math.max(0, ...reg.scenarios.map((s) => parseInt(String(s.id).replace('IMG-', ''), 10) || 0)) + 1;

function push(s) {
  if (reg.scenarios.some((x) => x.id === s.id)) return;
  reg.scenarios.push(s);
}

const stretch = [
  { name: 'Corpus 10400', harness: 'corpus-scale-c3', minCards: 10400 },
  { name: 'Obligations index 100', harness: 'obligations-100', minObligations: 100 },
  { name: 'EM-0 config 500 floor', harness: 'em0-config-floor', minConfigNodes: 500 },
  { name: 'EM-1 2200 floor', harness: 'extreme-map', minFlowSteps: 2200 },
  { name: 'EM-2 controls 4500', harness: 'em2-controls', minControls: 4500 },
  { name: 'EM-3 touchpoints 2500', harness: 'em3-floor', minTouchpoints: 2500 },
  { name: 'EM-4 conflicts 80', harness: 'em4-conflicts', minConflicts: 80 },
  { name: 'Retrieval baseline 75', harness: 'retrieval' },
  { name: 'Protocols 550 active', harness: 'security-protocols', minActive: 550 },
  { name: 'Jurisdiction 50 markets', harness: 'jurisdiction-bundles', minMarkets: 50 },
  { name: 'Agent directives 20', harness: 'agent-directives', minTemplates: 20 },
  { name: 'Stretch suite present', harness: 'stretch-suite' },
  { name: 'Vectorize manifest export', harness: 'vectorize-manifest' },
  { name: 'Corpus scale-c2', harness: 'corpus-scale-c2' },
  { name: 'Compose tier EC-013', harness: 'compose-ec013' },
  { name: 'Integration matrix', harness: 'integration-matrix' },
  { name: 'Compose precedence', harness: 'compose-precedence' },
  { name: 'Golden outbound', harness: 'outbound' },
  { name: 'Golden e2e', harness: 'e2e' },
  { name: 'Rules coverage', harness: 'rules-coverage' },
  { name: 'Corpus balance', harness: 'corpus-balance' },
  { name: 'Scale profiles', harness: 'scale-profiles' },
  { name: 'Resume-all docs', harness: 'resume-all' },
  { name: 'Corpus scale-d', harness: 'corpus-scale-d', minCards: 8000 },
  { name: 'Planning exhaustion meta', harness: 'doc', path: 'docs/engine/PLANNING_EXHAUSTION_STATUS.md' },
];

for (const s of stretch) {
  push({
    id: `IMG-${n++}`,
    minPassRate: 0.9,
    ...s,
  });
}

reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination phase S — ${reg.scenarioCount} total (+${stretch.length} catalogued)`);
