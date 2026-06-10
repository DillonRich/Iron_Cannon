#!/usr/bin/env node
/** Compact retrieval index for Worker bundle (refId + hint only). */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(ROOT, 'docs/engine/specimens/reference-index.specimen.json');
const OUT = join(ROOT, 'packages/mcp-core/src/generated/retrieval-index-lite.json');

const src = JSON.parse(readFileSync(INDEX, 'utf8'));
const lite = {
  rulesetVersion: src.rulesetVersion,
  cardCount: src.cardCount,
  entries: src.entries.map((e) => ({
    refId: e.refId,
    hint: e.embeddingHint ?? e.title ?? '',
    provider: e.provider,
  })),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(lite) + '\n');
console.log(`✓ retrieval-index-lite — ${lite.entries.length} entries → ${OUT}`);
process.exit(0);
