#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/agent-directive-templates.json');
if (!existsSync(path)) {
  console.error('missing agent-directive-templates.json');
  process.exit(1);
}
const t = JSON.parse(readFileSync(path, 'utf8'));
const MIN = 20;
if ((t.templates?.length ?? 0) < MIN) {
  console.error(`need >=${MIN} directive templates`);
  process.exit(1);
}
console.log(`✓ Agent directive templates — ${t.templates.length}`);
process.exit(0);
