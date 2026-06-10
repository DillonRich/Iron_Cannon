#!/usr/bin/env node
/** G-13 — vendor changelog watch cards must resolve to corpus specimens and stay within cadence */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WATCH_PATH = join(ROOT, 'docs/engine/planning/vendor-changelog-watch.json');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const watch = JSON.parse(readFileSync(WATCH_PATH, 'utf8'));
const refIds = new Set();
for (const file of readdirSync(REF_DIR)) {
  if (!file.endsWith('.specimen.json')) continue;
  const card = JSON.parse(readFileSync(join(REF_DIR, file), 'utf8'));
  if (card.refId) refIds.add(card.refId);
}

const failures = [];
const warnings = [];
const now = Date.now();

for (const w of watch.watches ?? []) {
  if (!w.refId) {
    failures.push('watch entry missing refId');
    continue;
  }
  if (!refIds.has(w.refId)) {
    failures.push(`${w.provider}: refId ${w.refId} not in corpus — harvest first`);
    continue;
  }
  if (!w.lastChecked) {
    failures.push(`${w.refId}: missing lastChecked`);
    continue;
  }
  const cadence = w.cadenceDays ?? watch.cadenceDaysDefault ?? 7;
  const ageDays = (now - Date.parse(w.lastChecked)) / 86_400_000;
  if (ageDays > cadence) {
    warnings.push(`${w.refId}: lastChecked ${w.lastChecked} exceeds ${cadence}d cadence`);
  }
}

if (failures.length) {
  console.error('Vendor changelog watch:\n' + failures.join('\n'));
  process.exit(1);
}

const msg = `✓ Vendor changelog watch — ${watch.watches.length} watches linked`;
if (warnings.length) {
  console.log(`${msg} (${warnings.length} stale — operator review)`);
  for (const w of warnings) console.log(`  warn: ${w}`);
} else {
  console.log(msg);
}
process.exit(0);
