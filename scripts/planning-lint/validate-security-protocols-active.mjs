#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const reg = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
);

const active = reg.protocols.filter((p) => p.status === 'active' && (p.mitigationSteps?.length ?? 0) >= 2);
const planned = reg.protocols.filter((p) => p.status === 'planned').length;

const failures = [];
const MIN_ACTIVE = 2100;
if (active.length < MIN_ACTIVE) failures.push(`active protocols ${active.length} < ${MIN_ACTIVE}`);
if (planned > 0) failures.push(`planned protocols ${planned} > 0 (run activate-security-protocols)`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Security protocols — ${active.length} active, ${planned} planned`);
process.exit(0);
