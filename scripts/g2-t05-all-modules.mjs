#!/usr/bin/env node
/** T05 calibration for every module fixture in bundle */
process.env.IRON_CANNON_SKIP_WIREMAP_GATE = '1';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { verifyModuleCompliance } from '../packages/mcp-core/src/t05-verify.js';
import { loadModuleFixture } from '../packages/mcp-core/src/load-fixture.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(ROOT, 'docs/engine/specimens/fixtures/modules');
const errors = [];

const files = readdirSync(dir).filter((x) => x.endsWith('.fixture-spec.json'));
for (const f of files) {
  const moduleId = f.replace('.fixture-spec.json', '');
  const spec = loadModuleFixture(moduleId);
  const cal = verifyModuleCompliance(spec);
  if (!cal.compliant) errors.push(`${moduleId}`);
}

if (errors.length) {
  console.error('G-2 T05 all modules:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`✓ G-2 T05 all modules — ${files.length} fixtures calibrated`);
process.exit(0);
