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
  ['EC-056', 'EC-057', 'EC-058', 'EC-059', 'EC-060'].includes(e.id),
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
  name: 'Retrieval baseline 50 queries',
  harness: 'retrieval',
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Security protocols 350 active',
  harness: 'security-protocols',
  minActive: 350,
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Agent directives 14 templates',
  harness: 'agent-directives',
  minTemplates: 14,
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'EM-4 conflicts 60',
  harness: 'em4-conflicts',
  minConflicts: 60,
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Planning quality gates wave 50',
  harness: 'doc',
  path: 'docs/engine/PLANNING_QUALITY_GATES.md',
  minPassRate: 0.9,
});

reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination phase N — +${added.length} scenarios (${reg.scenarioCount} total)`);
