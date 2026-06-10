#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PATHS } from './lib/paths.mjs';
import { loadState, saveState } from './lib/state.mjs';

const autoOnly = process.argv.includes('--auto-only');
const maxPublish = Number(process.argv.find((a) => a.startsWith('--max='))?.split('=')[1] ?? '9999');

mkdirSync(PATHS.references, { recursive: true });
const state = loadState();
let published = 0;

for (const file of readdirSync(PATHS.drafts).filter((f) => f.endsWith('.draft.json'))) {
  if (published >= maxPublish) break;
  const draft = JSON.parse(readFileSync(join(PATHS.drafts, file), 'utf8'));
  if (autoOnly && !draft.harvestMeta?.autoApproved) continue;
  if (!draft.refId || draft.refId.includes('llms-txt') || /llms\.txt/i.test(draft.sourceUrl ?? '')) continue;
  if (!draft.excerpt || draft.excerpt.length < 80) continue;

  const outName = file.replace('.draft.json', '.specimen.json');
  const outPath = join(PATHS.references, outName);
  if (existsSync(outPath)) continue;

  const { harvestMeta, _draft, ...card } = draft;
  writeFileSync(outPath, JSON.stringify(card, null, 2) + '\n', 'utf8');
  state.published[draft.refId] = { at: new Date().toISOString(), file: outName };
  published += 1;
  console.log(`  ✓ published ${draft.refId}`);
}

saveState(state);
console.log(`✓ Publish — ${published} cards → specimens/references`);
