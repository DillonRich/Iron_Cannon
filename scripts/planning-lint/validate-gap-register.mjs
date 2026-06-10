#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/gap-register.json');
const roadmap = join(ROOT, 'docs/engine/PLANNING_GAP_CLOSURE_ROADMAP.md');
const failures = [];
if (!existsSync(path)) failures.push('missing gap-register.json');
if (!existsSync(roadmap)) failures.push('missing PLANNING_GAP_CLOSURE_ROADMAP.md');
if (!failures.length) {
  const reg = JSON.parse(readFileSync(path, 'utf8'));
  const stage = reg.currentStage ?? 'core-mcp';
  const open = reg.gaps.filter((g) => {
    const gStage = g.stage ?? 'core-mcp';
    if (gStage !== stage) return false;
    return g.status === 'open' || g.status === 'partial';
  });
  if (open.length > 0) {
    failures.push(`${open.length} ${stage} gap(s) open/partial: ${open.map((g) => g.id).join(', ')}`);
  }
  for (const g of reg.gaps) {
    if (!g.id || !g.title || !g.status) failures.push(`invalid gap entry ${g.id}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
const reg = JSON.parse(readFileSync(path, 'utf8'));
const stage = reg.currentStage ?? 'core-mcp';
const openN = reg.gaps.filter((g) => (g.stage ?? 'core-mcp') === stage && (g.status === 'open' || g.status === 'partial')).length;
const closedN = reg.gaps.filter((g) => g.status === 'closed').length;
const deferredN = reg.gaps.filter((g) => g.status === 'deferred').length;
const plannedN = reg.gaps.filter((g) => (g.stage ?? 'core-mcp') === stage && g.status === 'planned').length;
console.log(
  `✓ Gap register — ${reg.gaps.length} gaps (${closedN} closed, ${deferredN} deferred, ${plannedN} planned, ${openN} open for stage ${stage})`,
);
process.exit(0);
