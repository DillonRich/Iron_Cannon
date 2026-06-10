#!/usr/bin/env node
/** Populate owasp.json inventory from cheatsheetseries index */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { PATHS } from './lib/paths.mjs';

const INDEX_URL = 'https://cheatsheetseries.owasp.org/index.html';

const res = await fetch(INDEX_URL, {
  headers: { 'User-Agent': 'IronCannon-CorpusHarvest/1.0' },
});
if (!res.ok) throw new Error(`OWASP index HTTP ${res.status}`);
const html = await res.text();
const links = [];
const re = /href="([^"]*cheatsheets\/[^"]+\.html)"/gi;
let m;
while ((m = re.exec(html)) !== null) {
  const path = m[1].replace(/^\//, '');
  const title = path.replace(/^cheatsheets\//, '').replace(/_/g, ' ').replace('.html', '');
  links.push({
    title,
    url: `https://cheatsheetseries.owasp.org/${path}`,
    provider: 'owasp',
  });
}

const dedup = new Map();
for (const l of links) dedup.set(l.url, l);
const out = [...dedup.values()];

writeFileSync(
  join(PATHS.inventory, 'owasp.json'),
  JSON.stringify({ synced: new Date().toISOString(), count: out.length, links: out }, null, 2) + '\n',
  'utf8',
);
console.log(`✓ OWASP inventory — ${out.length} cheatsheet links`);
