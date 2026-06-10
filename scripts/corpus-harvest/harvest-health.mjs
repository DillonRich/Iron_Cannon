#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const out = join(ROOT, 'harvest-data/harvest-health.json');
const queuePath = join(ROOT, 'harvest-data/harvest-queue.json');
const regPath = join(ROOT, 'harvest-data/provider-registry.json');

const report = { generated: new Date().toISOString(), queue: null, providers: {}, cards: 0 };

if (existsSync(queuePath)) {
  const q = JSON.parse(readFileSync(queuePath, 'utf8'));
  report.queue = {
    pending: q.pending?.length ?? 0,
    done: q.done?.length ?? 0,
    failed: q.failed?.length ?? 0,
  };
}
if (existsSync(regPath)) {
  const reg = JSON.parse(readFileSync(regPath, 'utf8'));
  for (const [p, v] of Object.entries(reg.providers ?? reg)) {
    if (typeof v === 'object' && v !== null) {
      report.providers[p] = { links: v.links?.length ?? v.total ?? 0 };
    }
  }
}
const refDir = join(ROOT, 'docs/engine/specimens/references');
report.cards = readdirSync(refDir).filter((f) => f.endsWith('.specimen.json')).length;

writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(`✓ Harvest health — ${report.cards} cards, queue ${JSON.stringify(report.queue)}`);
