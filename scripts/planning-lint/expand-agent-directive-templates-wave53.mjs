#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/agent-directive-templates.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.templates.map((t) => t.templateId));
const added = [
  { templateId: 'DIR-OBLIGATION-001', phase: 'COMPLIANCE', tierMin: 'ironclad', agentMust: ['Run T12 compare for each LEG-W53 obligation in scope'], agentMustNot: ['Skip L4 disclaimer on compliance output'] },
  { templateId: 'DIR-CONFIG-001', phase: 'TOOL_GATE', tierMin: 'pro', agentMust: ['Cross-check T02 stack signals against EM-0 config nodes'], agentMustNot: ['Assume wrangler.toml complete without T02'] },
];
for (const t of added) {
  if (!existing.has(t.templateId)) reg.templates.push(t);
}
reg.templateCount = reg.templates.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Agent directives wave 53 — ${reg.templateCount}`);
