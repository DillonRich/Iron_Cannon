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
  ['EC-051', 'EC-052', 'EC-053', 'EC-054', 'EC-055'].includes(e.id),
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
  name: 'Retrieval baseline 40 queries',
  harness: 'retrieval',
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Security protocols 300 active',
  harness: 'security-protocols',
  minActive: 300,
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Agent directives 12 templates',
  harness: 'agent-directives',
  minTemplates: 12,
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Planning quality gates doc',
  harness: 'doc',
  path: 'docs/engine/PLANNING_QUALITY_GATES.md',
  minPassRate: 0.9,
});

reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination phase M — +${added.length} (total ${reg.scenarios.length})`);
