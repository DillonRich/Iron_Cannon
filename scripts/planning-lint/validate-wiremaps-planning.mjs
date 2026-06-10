#!/usr/bin/env node
/** Validates WIREMAPS.md meets MASTER_PLAN P0-T010–T019 acceptance thresholds */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const wm = readFileSync(join(ROOT, 'docs/WIREMAPS.md'), 'utf8');
const failures = [];

const mermaidCount = (wm.match(/```mermaid/g) || []).length;
if (mermaidCount < 20) failures.push(`mermaid blocks ${mermaidCount} < 20`);

for (let i = 1; i <= 20; i++) {
  const id = `SC-V${String(i).padStart(2, '0')}`;
  if (!wm.includes(id)) failures.push(`missing stripe variant ${id}`);
}

for (let i = 1; i <= 12; i++) {
  const id = `E${String(i).padStart(2, '0')}`;
  if (!wm.includes(`| ${id} `)) failures.push(`missing edge case ${id}`);
}

if (!wm.includes('erDiagram')) failures.push('§9 ER diagram missing');
if (!wm.includes('### 8.1 Surface')) failures.push('§8.1 security matrix missing');
if (!wm.includes('auth-lifecycle') || !wm.includes('billing-subscription')) {
  failures.push('core flows not referenced');
}

if (failures.length) {
  console.error('Wiremaps planning failures:\n' + failures.map((f) => `  ✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log(
  `✓ Wiremaps planning — ${mermaidCount} mermaid, 20 stripe variants, 12 edge cases, ER + security matrix`,
);
process.exit(0);
