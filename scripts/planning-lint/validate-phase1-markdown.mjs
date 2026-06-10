#!/usr/bin/env node
/**
 * Ensures Phase 1 chunk markdown docs exist and contain required sections.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const errors = [];

const REQUIRED = [
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK1_SCHEMAS.md',
    markers: ['rule-fragment.v1.json', 'validate-schemas.ts', 'Chunk 1 copy gate'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK2_VERIFY.md',
    markers: ['match.ts', 'm12.webhook.test.ts', 'Chunk 2 copy gate'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK3_COMPOSE.md',
    markers: ['merge.ts', 'm01.compose.test.ts', 'Chunk 3 copy gate'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK4_MCP.md',
    markers: ['tool-registry.ts', 'scanner.ts', 'Chunk 4 planning gate', 'routeRemoteTool'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK5A_T03_WIREMAP.md',
    markers: ['wiremap-generator.ts', 'Chunk 5a planning gate', 'composeWiremaps', 'canonicalWiremapHash'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK5B_T06_T08.md',
    markers: ['state-log-parser.ts', 'Chunk 5b planning gate', 'runContinuousDiffCheck', 'rollbackToModule'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK6_RULES_PACKAGE.md',
    markers: ['rule-loader.ts', 'Chunk 6 planning gate', 'rules-manifest.json'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK7_T04_T05_MODULES.md',
    markers: ['Chunk 7 planning gate', 'GOLDEN_MODULE_IDS', 'handleVerifyCompliance'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK8_T09_T11_ARMOR.md',
    markers: ['Chunk 8 planning gate', 'handleMapSurfaces', 'surface-catalog.json'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK9_T12_T14_IRONCLAD.md',
    markers: ['Chunk 9 planning gate', 'legalDisclaimer', 'TIER_INSUFFICIENT'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK10_C14_SLICER.md',
    markers: ['Chunk 10', 'slicePayload', 'SLICE_BUDGETS'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK10B_OPTIONAL_MODULES.md',
    markers: ['OPTIONAL_MODULE_IDS', 'Chunk 10b'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK11_C09_C10_AUTH.md',
    markers: ['Chunk 11', 'parseAuth', 'checkRateLimit'],
  },
  {
    path: 'docs/engine/PLANNING_T14_EXHAUSTION_SIGNOFF.md',
    markers: ['Planning exhausted', 'T01–T14'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK12_COMPARE_ENGINE.md',
    markers: ['Chunk 12', 'evaluateDetect', 'LEGAL_DISCLAIMER'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_CHUNK13_C15_OUTBOUND.md',
    markers: ['Chunk 13', 'validateOutbound', 'mcp-response-envelope'],
  },
  {
    path: 'docs/engine/PLANNING_R12_IMAGINATION_50.md',
    markers: ['IMG-001', '≥90%', 'simulate-imagination-50'],
  },
  {
    path: 'docs/engine/MCP_TOOL_STATUS.md',
    markers: ['Golden-State Gap', 'T01', 'Chunk 4'],
  },
  {
    path: 'docs/engine/PLANNING_PHASE1_REPO_LAYOUT.md',
    markers: ['Copy gate', 'packages/'],
  },
];

for (const { path, markers } of REQUIRED) {
  const full = join(ROOT, path);
  if (!existsSync(full)) {
    errors.push(`Missing: ${path}`);
    continue;
  }
  const text = readFileSync(full, 'utf8');
  for (const m of markers) {
    if (!text.includes(m)) errors.push(`${path}: missing marker "${m}"`);
  }
}

if (errors.length) {
  console.error('Phase 1 markdown lint failures:\n' + errors.join('\n'));
  process.exit(1);
}

console.log('✓ Phase 1 chunk markdown structure OK');
process.exit(0);
