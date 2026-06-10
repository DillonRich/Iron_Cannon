#!/usr/bin/env node
/**
 * Scheduled regression — imagination 50/132 + psycho + §9.1.
 * Usage: npm run planning:regression
 */
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const LINT = join(ROOT, 'scripts/planning-lint');
const LOG_PATH = join(ROOT, 'docs/engine/planning/regression-schedule.json');

const SUITES = [
  { name: 'imagination50', script: 'simulate-imagination-50.mjs' },
  { name: 'userJourneyBehavioral', script: 'simulate-user-journey-behavioral.mjs' },
  { name: 'goldenReferenceApp', script: 'simulate-golden-reference-app.mjs' },
  { name: 'referenceAppGoldenPath', script: 'simulate-reference-app-golden-path.mjs' },
  { name: 'imaginationExtended', script: 'simulate-imagination-100.mjs' },
  { name: 'retrieval', script: 'simulate-retrieval-baseline.mjs' },
  { name: 'precedence', script: 'simulate-compose-precedence.mjs' },
  { name: 'diminishingReturns', script: 'validate-diminishing-returns.mjs' },
  { name: 'psycho', script: 'validate-psycho-scorecard.mjs' },
];

function run(script) {
  const r = spawnSync(process.execPath, [join(LINT, script)], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { ok: r.status === 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

const results = {};
const failures = [];
for (const s of SUITES) {
  const out = run(s.script);
  results[s.name] = out.ok;
  if (!out.ok) {
    failures.push(s.name);
    console.error(out.stderr || out.stdout);
  } else {
    console.log(out.stdout.trim().split('\n').pop());
  }
}

const entry = {
  timestamp: new Date().toISOString(),
  results,
  pass: failures.length === 0,
};

const log = existsSync(LOG_PATH)
  ? JSON.parse(readFileSync(LOG_PATH, 'utf8'))
  : { version: '1.0.0', schedule: { minIntervalHours: 24, suites: SUITES.map((s) => s.name) }, runs: [] };

log.runs.push(entry);
if (log.runs.length > 90) log.runs = log.runs.slice(-90);
writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n');

if (failures.length) {
  console.error(`Scheduled regression FAILED: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`✓ Scheduled regression — ${SUITES.length} suites pass (logged)`);
process.exit(0);
