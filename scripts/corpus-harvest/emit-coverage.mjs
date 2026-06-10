#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PATHS } from './lib/paths.mjs';

const coverage = { generated: new Date().toISOString(), providers: {} };

for (const file of readdirSync(PATHS.inventory).filter((f) => f.endsWith('.json') && !f.startsWith('_'))) {
  const inv = JSON.parse(readFileSync(join(PATHS.inventory, file), 'utf8'));
  const provider = file.replace('.json', '');
  const published = readdirSync(PATHS.references).filter((f) => f.startsWith(`${provider}-`)).length;
  let queued = 0;
  if (existsSync(PATHS.queue)) {
    const q = JSON.parse(readFileSync(PATHS.queue, 'utf8'));
    queued = q.items.filter((i) => i.provider === provider).length;
  }
  coverage.providers[provider] = {
    inventoryTotal: inv.count ?? inv.links?.length ?? 0,
    cardsPublished: published,
    p0Queued: queued,
  };
}

const totalCards = readdirSync(PATHS.references).filter((f) => f.endsWith('.specimen.json')).length;
coverage.totalCards = totalCards;
coverage.scaleA = { target: 500, gap: Math.max(0, 500 - totalCards) };
coverage.scaleB = { target: 1000, gap: Math.max(0, 1000 - totalCards) };
coverage.scaleC = { target: 3000, gap: Math.max(0, 3000 - totalCards) };
coverage.scaleD = { target: 10000, gap: Math.max(0, 10000 - totalCards) };

writeFileSync(PATHS.coverage, JSON.stringify(coverage, null, 2) + '\n', 'utf8');
console.log(
  `✓ Coverage — ${totalCards} cards (A:${coverage.scaleA.gap} B:${coverage.scaleB.gap} C:${coverage.scaleC.gap} D:${coverage.scaleD.gap})`,
);
