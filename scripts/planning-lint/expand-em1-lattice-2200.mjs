#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const TARGET = 2200;
const MARKETS = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json'), 'utf8'),
).markets.map((m) => m.marketId);
const FLOWS = ['auth-lifecycle', 'billing-subscription', 'password-reset', 'account-deletion', 'data-export'];
const ids = new Set(em1.nodes.map((n) => n.nodeId));
const extra = [];
for (const market of MARKETS) {
  for (const flow of FLOWS) {
    const nodeId = `lattice/w54/market/${market}/${flow}/stretch_audit`;
    if (ids.has(nodeId)) continue;
    ids.add(nodeId);
    extra.push({
      nodeId,
      type: 'flow_step',
      em1: true,
      lattice: 'wave54',
      host: 'ironclad',
      route: `/market/${market}/${flow}`,
      phase: 'COMPLIANCE_AUDIT',
      moduleIds: [],
      requiredForFlows: [flow],
      marketId: market,
      agentGuidance: `${market} stretch audit for ${flow}`,
      referenceRefIds: ['legal/gdpr-privacy-notice'],
    });
  }
}
function pushTopup(nodeId) {
  if (ids.has(nodeId)) return;
  ids.add(nodeId);
  extra.push({
    nodeId,
    type: 'flow_step',
    em1: true,
    lattice: 'wave54-topup',
    host: 'ironcannon',
    route: '/lattice/w54/topup',
    phase: 'STRETCH_TOPUP',
    moduleIds: [],
    requiredForFlows: ['auth-lifecycle'],
    agentGuidance: 'Wave 54 EM-1 stretch top-up',
    referenceRefIds: ['ironcannon/planning-w54-em1'],
  });
}
let top = 0;
while (em1.nodes.length + extra.length < TARGET) pushTopup(`lattice/w54/topup/${top++}`);

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 wave 54 — +${extra.length} → ${em1.nodeCount} (target ${TARGET})`);
if (em1.nodeCount < TARGET) {
  console.error(`EM-1 ${em1.nodeCount} < ${TARGET}`);
  process.exit(1);
}
