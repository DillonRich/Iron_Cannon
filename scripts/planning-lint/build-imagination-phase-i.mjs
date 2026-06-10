#!/usr/bin/env node
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

push({
  id: `IMG-${n++}`,
  name: 'Retrieval baseline calibrated top-3',
  harness: 'retrieval',
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Corpus scale-c3 planning batch 400',
  harness: 'corpus-scale-c3',
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Harvest queue dry run zero publish',
  harness: 'edge-case',
  edgeCaseId: 'EC-035',
  minPassRate: 0.9,
});
push({
  id: `IMG-${n++}`,
  name: 'Scale-C gap after c3 bootstrap',
  harness: 'corpus-scale',
  tier: 'c',
  minPassRate: 0.9,
});

reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination phase I — +${added.length} (total ${reg.scenarios.length})`);
