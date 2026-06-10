#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const edge = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/edge-case-registry.json'), 'utf8'));
const reg = JSON.parse(readFileSync(regPath, 'utf8'));
let n = Math.max(0, ...reg.scenarios.map((s) => parseInt(String(s.id).replace('IMG-', ''), 10) || 0)) + 1;
const added = [];
function push(s) {
  if (reg.scenarios.some((x) => x.id === s.id)) return;
  added.push(s);
  reg.scenarios.push(s);
}
for (const ec of edge.edgeCases.filter((e) => ['EC-071', 'EC-072', 'EC-073', 'EC-074', 'EC-075'].includes(e.id))) {
  push({ id: `IMG-${n++}`, name: `Edge ${ec.id}`, harness: 'edge-case', edgeCaseId: ec.id, minPassRate: 0.9 });
}
push({ id: `IMG-${n++}`, name: 'EM-1 2000 + EM-0 500 stretch', harness: 'extreme-map', minFlowSteps: 2000, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'EM-0 config 500', harness: 'em0-config-floor', minConfigNodes: 500, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Obligations 100', harness: 'obligations-100', minObligations: 100, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Retrieval 65', harness: 'retrieval', minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Protocols 500', harness: 'security-protocols', minActive: 500, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Jurisdiction 45', harness: 'jurisdiction-bundles', minMarkets: 45, minPassRate: 0.9 });
reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination phase Q — ${reg.scenarioCount} total (+${added.length})`);
