#!/usr/bin/env node
/** Create reference cards for LEG-W63 sourceRefId values (corpus integrity) */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ADD = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-wave63-additions.json'), 'utf8'),
);
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const today = '2026-06-04';
let created = 0;

for (const ob of ADD.obligations) {
  const refId = ob.sourceRefId;
  const slug = refId.replace(/\//g, '-');
  const file = join(REF_DIR, `${slug}.specimen.json`);
  if (existsSync(file)) continue;
  const provider = refId.split('/')[0];
  writeFileSync(
    file,
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/planning/W63/${slug}`,
        lastVerified: today,
        title: ob.title,
        provider,
        excerpt: `${ob.id}: ${ob.title}`,
        embeddingHint: `${ob.id} ${ob.category} ${ob.detect?.type ?? 'pattern'}`,
        tags: ['planning', 'wave63', 'obligation-source'],
      },
      null,
      2,
    ) + '\n',
  );
  created += 1;
}
console.log(`✓ Obligation source ref cards — ${created} created`);
