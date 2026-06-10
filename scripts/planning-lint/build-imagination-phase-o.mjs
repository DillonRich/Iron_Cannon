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
  ['EC-061', 'EC-062', 'EC-063', 'EC-064', 'EC-065'].includes(e.id),
)) {
  push({
    id: `IMG-${n++}`,
    name: `Edge ${ec.id} ${ec.signal}`,
    harness: 'edge-case',
    edgeCaseId: ec.id,
    minPassRate: 0.9,
  });
}

push({ id: `IMG-${n++}`, name: 'EM-1 flow steps 1500 lattice', harness: 'extreme-map', minFlowSteps: 1500, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Jurisdiction bundles 35 markets', harness: 'jurisdiction-bundles', minMarkets: 35, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Retrieval baseline 55 queries', harness: 'retrieval', minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Security protocols 400 active', harness: 'security-protocols', minActive: 400, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'EM-4 conflicts 65', harness: 'em4-conflicts', minConflicts: 65, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Corpus planning w51 +100 cards', harness: 'corpus-scale-d', minCards: 10000, minPassRate: 0.9 });

reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination phase O — +${added.length} scenarios (${reg.scenarioCount} total)`);
