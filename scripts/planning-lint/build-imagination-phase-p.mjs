#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const edge = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/edge-case-registry.json'), 'utf8'),
);
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

for (const ec of edge.edgeCases.filter((e) =>
  ['EC-066', 'EC-067', 'EC-068', 'EC-069', 'EC-070'].includes(e.id),
)) {
  push({
    id: `IMG-${n++}`,
    name: `Edge ${ec.id} ${ec.signal}`,
    harness: 'edge-case',
    edgeCaseId: ec.id,
    minPassRate: 0.9,
  });
}

push({ id: `IMG-${n++}`, name: 'EM-1 flow steps 1800 lattice', harness: 'extreme-map', minFlowSteps: 1800, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Jurisdiction bundles 40 markets', harness: 'jurisdiction-bundles', minMarkets: 40, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Retrieval baseline 60 queries', harness: 'retrieval', minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Security protocols 450 active', harness: 'security-protocols', minActive: 450, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'EM-4 conflicts 70', harness: 'em4-conflicts', minConflicts: 70, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'EM-2 controls 3500 floor', harness: 'em2-controls', minControls: 3500, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Corpus planning w52 +100 cards', harness: 'corpus-scale-d', minCards: 10000, minPassRate: 0.9 });

reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination phase P — +${added.length} scenarios (${reg.scenarioCount} total)`);
