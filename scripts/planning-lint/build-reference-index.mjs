#!/usr/bin/env node
/** Build reference-index.specimen.json from docs/engine/specimens/references/*.specimen.json */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const OUT = join(ROOT, 'docs/engine/specimens/reference-index.specimen.json');

const entries = [];
for (const file of readdirSync(REF_DIR).filter((f) => f.endsWith('.specimen.json'))) {
  const card = JSON.parse(readFileSync(join(REF_DIR, file), 'utf8'));
  if (!card.refId) continue;
  const provider = card.refId.split('/')[0];
  entries.push({
    refId: card.refId,
    specimenPath: `specimens/references/${file}`,
    provider,
    tags: card.tags ?? [],
    appliesTo: card.appliesTo ?? [],
    lastVerified: card.lastVerified ?? null,
    title: card.title ?? '',
    embeddingHint: [provider, ...(card.tags ?? []), card.title ?? ''].join(' ').toLowerCase(),
  });
}
entries.sort((a, b) => a.refId.localeCompare(b.refId));

const index = {
  $schema: 'https://ironcannon.dev/schemas/reference-index/v1',
  rulesetVersion: '2026.05.31',
  generatedAt: new Date().toISOString().slice(0, 10),
  cardCount: entries.length,
  entries,
};

writeFileSync(OUT, JSON.stringify(index, null, 2) + '\n', 'utf8');
console.log(`Wrote ${OUT} (${entries.length} cards)`);
