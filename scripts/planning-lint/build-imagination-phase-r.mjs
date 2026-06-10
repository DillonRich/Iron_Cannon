#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const edge = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/edge-case-registry.json'), 'utf8'));
const reg = JSON.parse(readFileSync(regPath, 'utf8'));
let n = Math.max(0, ...reg.scenarios.map((s) => parseInt(String(s.id).replace('IMG-', ''), 10) || 0)) + 1;
function push(s) {
  if (reg.scenarios.some((x) => x.id === s.id)) return;
  reg.scenarios.push(s);
}
for (const ec of edge.edgeCases.filter((e) => ['EC-076', 'EC-077', 'EC-078', 'EC-079', 'EC-080'].includes(e.id))) {
  push({ id: `IMG-${n++}`, name: `Edge ${ec.id}`, harness: 'edge-case', edgeCaseId: ec.id, minPassRate: 0.9 });
}
push({ id: `IMG-${n++}`, name: 'EM-1 2200', harness: 'extreme-map', minFlowSteps: 2200, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'EM-0 config 500', harness: 'em0-config-floor', minConfigNodes: 500, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Retrieval 75', harness: 'retrieval', minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Protocols 550', harness: 'security-protocols', minActive: 550, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Jurisdiction 50', harness: 'jurisdiction-bundles', minMarkets: 50, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'EM-4 80', harness: 'em4-conflicts', minConflicts: 80, minPassRate: 0.9 });
push({ id: `IMG-${n++}`, name: 'Stretch test suite', harness: 'stretch-suite', minPassRate: 0.9 });
reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination phase R — ${reg.scenarioCount} total`);
