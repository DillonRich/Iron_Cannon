#!/usr/bin/env node
/**
 * Starter-scope proof — T01 on real reference app + T05 pattern check on module files.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { invokeTool } from './lib/mcp-invoke.mjs';
import { verifyModuleCompliance } from '../../packages/mcp-core/src/t05-verify.js';
import { loadModuleFixture } from '../../packages/mcp-core/src/load-fixture.js';
import { validateStackCompleteness } from '@ironcannon/verify';
import {
  REFERENCE_APP_DIR,
  MODULE_FILES,
  REQUIRED_STRUCTURE,
} from './lib/golden-reference-app-modules.mjs';

const failures = [];

for (const rel of REQUIRED_STRUCTURE) {
  if (!existsSync(join(REFERENCE_APP_DIR, rel))) failures.push(`missing ${rel}`);
}

const t01 = await invokeTool('T01', { projectPath: REFERENCE_APP_DIR, tier: 'pro' });
if (!t01.stack?.supported) failures.push(`T01 supported=false warnings=${JSON.stringify(t01.stack?.warnings)}`);
const t02 = validateStackCompleteness(t01.stack);
if (!t02.complete) failures.push(`T02 incomplete missing=${JSON.stringify(t02.missing)}`);

let modulePass = 0;
for (const [moduleId, relPath] of Object.entries(MODULE_FILES)) {
  const full = join(REFERENCE_APP_DIR, relPath);
  if (!existsSync(full)) {
    failures.push(`${moduleId}: missing file ${relPath}`);
    continue;
  }
  const snippet = readFileSync(full, 'utf8');
  const spec = loadModuleFixture(moduleId);
  if (!spec) {
    failures.push(`${moduleId}: no fixture spec`);
    continue;
  }
  const result = verifyModuleCompliance(spec, snippet);
  if (!result.compliant) {
    failures.push(`${moduleId}: patterns missing ${JSON.stringify(result.missing)}`);
  } else {
    modulePass += 1;
  }
}

const minModules = 12;
if (modulePass < minModules) {
  failures.push(`module compliance ${modulePass}/${Object.keys(MODULE_FILES).length} (need ${minModules})`);
}

if (failures.length) {
  console.error('Golden reference app failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(
  `✓ Golden reference app — T01 SD-01 supported, T02 complete, ${modulePass}/${Object.keys(MODULE_FILES).length} modules pass T05 patterns`,
);
process.exit(0);
