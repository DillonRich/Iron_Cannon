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
  ['EC-036', 'EC-037', 'EC-038', 'EC-039', 'EC-040'].includes(e.id),
)) {
  push({
    id: `IMG-${n++}`,
    name: `Edge ${ec.id} ${ec.signal}`,
    harness: 'edge-case',
    edgeCaseId: ec.id,
    minPassRate: 0.9,
  });
}

for (const cid of ['CH-033', 'CH-034', 'CH-035', 'CH-036', 'CH-037']) {
  push({
    id: `IMG-${n++}`,
    name: `EM-4 ${cid}`,
    harness: 'em4-conflict',
    conflictId: cid,
    minPassRate: 0.9,
  });
}

push({
  id: `IMG-${n++}`,
  name: 'Retrieval baseline 30 queries',
  harness: 'retrieval',
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Corpus scale-c2 interim 2000',
  harness: 'corpus-scale-c2',
});

reg.scenarioCount = reg.scenarios.length;
reg.minScenarioCount = 240;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination Phase H — +${added.length} (total ${reg.scenarioCount})`);
