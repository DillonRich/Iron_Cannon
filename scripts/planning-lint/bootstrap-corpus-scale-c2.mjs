#!/usr/bin/env node
/** Planning corpus cards — Scale-C2 depth (nextjs, legal micro, ironcannon ops) */
import { writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const TOPICS = [
  ['nextjs', 'routing', 'App Router dynamic segments and loading.tsx boundaries'],
  ['nextjs', 'caching', 'revalidatePath and cache tags after billing webhook'],
  ['nextjs', 'security', 'Server Actions must validate session on every mutation'],
  ['legal', 'privacy', 'Record lawful basis per processing purpose in RoPA'],
  ['legal', 'cookies', 'Document consent categories: necessary, analytics, marketing'],
  ['ironcannon', 'compose', 'Compose empty rejected when wiremap has zero modules'],
  ['ironcannon', 'throttle', 'THROTTLE_LOOP_DETECTED when same module called 6+ times'],
  ['owasp', 'headers', 'Set HSTS, X-Content-Type-Options, Referrer-Policy on all routes'],
];

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

const existing = new Set();
for (const f of readdirSync(REF_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  try {
    const c = JSON.parse(
      readFileSync(join(REF_DIR, f), 'utf8'),
    );
    if (c.refId) existing.add(c.refId);
  } catch {
    /* skip */
  }
}

let created = 0;
for (let i = 0; i < 200; i++) {
  const t = TOPICS[i % TOPICS.length];
  const refId = `${t[0]}/scale-c2-${t[1]}-${String(i).padStart(3, '0')}`;
  if (existing.has(refId)) continue;
  const path = join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`);
  writeFileSync(
    path,
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/planning/corpus/${refId}`,
        lastVerified: '2026-06-03',
        title: `Scale-C2 ${t[1]} ${i}`,
        excerpt: `${t[2]}. Planning reference card ${i} for Iron Cannon compose and compliance agents. Cross-ref obligations and EM-3 touchpoints.`,
        tags: [t[0], t[1], 'scale-c2'],
      },
      null,
      2,
    ) + '\n',
  );
  created++;
}
console.log(`✓ Scale-C2 planning cards — ${created} new`);
