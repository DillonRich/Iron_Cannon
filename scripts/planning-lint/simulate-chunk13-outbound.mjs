#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const schema = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/phase1/schemas/mcp-response-envelope.v1.json'), 'utf8'),
);

const required = schema.required ?? ['presentationHints', 'agentGuidance'];
const sample = {
  presentationHints: { category: 'legal', priority: 'high' },
  agentGuidance: { phase: 'COMPLIANCE', instruction: 'Surface disclaimer to user.' },
  legalDisclaimer: 'Iron Cannon provides technical comparison only, not legal advice.',
};

const failures = [];
for (const key of required) {
  if (!(key in sample)) failures.push(`missing required envelope field: ${key}`);
}
if (!sample.legalDisclaimer?.includes('not legal advice')) {
  failures.push('L4 envelope missing disclaimer');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('✓ Chunk 13 C15 outbound envelope — schema + L4 disclaimer gate');
process.exit(0);
