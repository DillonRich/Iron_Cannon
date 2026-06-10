#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/code-block-registry.json');
const MIN = 80;
const failures = [];
if (!existsSync(path)) failures.push('run build-code-block-registry.mjs first');
else {
  const reg = JSON.parse(readFileSync(path, 'utf8'));
  if (reg.blockCount < MIN) failures.push(`blocks ${reg.blockCount} < ${MIN}`);
  const ts = reg.blocks.filter((b) => ['typescript', 'ts', 'javascript', 'js'].includes(b.lang)).length;
  const sql = reg.blocks.filter((b) => b.lang === 'sql').length;
  if (ts < 20) failures.push(`typescript blocks ${ts} < 20`);
  if (sql < 5) failures.push(`sql blocks ${sql} < 5`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
const reg = JSON.parse(readFileSync(path, 'utf8'));
console.log(`✓ Planning code blocks — ${reg.blockCount} registered`);
process.exit(0);
