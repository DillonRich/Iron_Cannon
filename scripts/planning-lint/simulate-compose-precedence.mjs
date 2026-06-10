#!/usr/bin/env node
/** Chunk 14 — compose precedence: rules > map > explicit cards > RAG */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const FIXTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/engine/specimens/fixtures/compose/precedence-golden.fixture-spec.json',
);

const PRIORITY = { rule: 1, map: 2, explicit_card: 3, rag: 4 };

function mergeWithPrecedence(sources) {
  const byKey = new Map();
  for (const src of sources) {
    for (const item of src.items) {
      const existing = byKey.get(item.key);
      if (!existing || PRIORITY[src.type] < PRIORITY[existing.type]) {
        byKey.set(item.key, { ...item, type: src.type });
      }
    }
  }
  return [...byKey.values()];
}

const spec = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const merged = mergeWithPrecedence(spec.input.sources);
const failures = [];

for (const exp of spec.expected.wins) {
  const got = merged.find((m) => m.key === exp.key);
  if (!got || got.type !== exp.type || got.value !== exp.value) {
    failures.push(`${exp.key}: expected ${exp.type}=${exp.value}, got ${got?.type}=${got?.value}`);
  }
}

if (failures.length) {
  console.error('Compose precedence failures:');
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log(`✓ Compose precedence — ${spec.expected.wins.length} conflict keys resolved correctly`);
process.exit(0);
