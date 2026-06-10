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
  ['EC-046', 'EC-047', 'EC-048', 'EC-049', 'EC-050'].includes(e.id),
)) {
  push({
    id: `IMG-${n++}`,
    name: `Edge ${ec.id} ${ec.signal}`,
    harness: 'edge-case',
    edgeCaseId: ec.id,
    minPassRate: 0.9,
  });
}

push({
  id: `IMG-${n++}`,
  name: 'EM-1 flow steps 800 lattice',
  harness: 'extreme-map',
  minFlowSteps: 800,
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'EM-4 conflicts 50',
  harness: 'em4-conflict',
  conflictId: 'CH-050',
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Corpus scale-d 10000',
  harness: 'corpus-scale-d',
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Vectorize manifest 10k vectors',
  harness: 'vectorize-manifest',
  minPassRate: 0.9,
});

reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination phase K — +${added.length} (total ${reg.scenarios.length})`);
