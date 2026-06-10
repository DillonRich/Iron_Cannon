#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const em3 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em3-legal-touchpoints.json'), 'utf8'),
);
const MIN = 2000;
const TARGET = 1500;
const failures = [];
if (em3.touchpointCount < MIN) failures.push(`touchpoints ${em3.touchpointCount} < ${MIN} (target ${TARGET})`);
const withRefs = em3.touchpoints.filter((t) => (t.referenceRefIds?.length ?? 0) > 0).length;
if (withRefs / em3.touchpointCount < 0.55) failures.push('ref link rate < 55%');
const routes = new Set(em3.touchpoints.map((t) => t.route).filter(Boolean));
if (routes.size < 8) failures.push(`distinct routes ${routes.size} < 8`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✓ EM-3 legal — ${em3.touchpointCount} touchpoints, ${withRefs} with refs`);
process.exit(0);
