#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildConfigNodes, buildFlowSteps } from './lib/em0-node-catalog.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const configNodes = buildConfigNodes();
const flowSteps = buildFlowSteps();
const allNodes = [...configNodes, ...flowSteps];

const em0Config = join(ROOT, 'docs/engine/planning/em0-config-nodes.json');
const em0Steps = join(ROOT, 'docs/engine/planning/em0-flow-steps.json');
const specimen = join(ROOT, 'docs/engine/specimens/extreme-map.specimen.json');

writeFileSync(
  em0Config,
  JSON.stringify({ rulesetVersion: '2026.05.31', nodeCount: configNodes.length, nodes: configNodes }, null, 2) + '\n',
  'utf8',
);
writeFileSync(
  em0Steps,
  JSON.stringify({ rulesetVersion: '2026.05.31', nodeCount: flowSteps.length, nodes: flowSteps }, null, 2) + '\n',
  'utf8',
);

const withRefs = configNodes.filter((n) => n.referenceRefIds?.length > 0).length;
const refRate = configNodes.length ? withRefs / configNodes.length : 0;

const specimenBody = {
  $schema: 'https://ironcannon.dev/schemas/extreme-map/v1',
  rulesetVersion: '2026.05.31',
  meta: {
    em0ConfigCount: configNodes.length,
    em0FlowStepCount: flowSteps.length,
    configRefLinkRate: Number(refRate.toFixed(3)),
  },
  nodes: allNodes.slice(0, 120),
};

writeFileSync(specimen, JSON.stringify(specimenBody, null, 2) + '\n', 'utf8');

console.log(`EM-0 config nodes: ${configNodes.length}`);
console.log(`EM-0 flow steps: ${flowSteps.length}`);
console.log(`Config refId link rate: ${(refRate * 100).toFixed(1)}%`);
console.log(`extreme-map.specimen.json: ${specimenBody.nodes.length} nodes (lint subset)`);
