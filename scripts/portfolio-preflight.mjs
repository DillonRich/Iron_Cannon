#!/usr/bin/env node
/** Pre-push check — no live secrets in tracked source paths. */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', '.wrangler', 'harvest-data', 'rules']);
const BAD = [
  /sk_live_[a-zA-Z0-9]{10,}/,
  /rk_live_[a-zA-Z0-9]{10,}/,
  /whsec_(?!test)[a-zA-Z0-9]{12,}/,
  /CLOUDFLARE_API_TOKEN\s*=\s*['"][^'"]{8,}['"]/,
  /BEGIN (RSA |OPENSSH )?PRIVATE KEY/,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|ts|json|toml|env|yaml|yml|md)$/i.test(name)) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(ROOT)) {
  const rel = file.slice(ROOT.length + 1).replace(/\\/g, '/');
  if (rel.startsWith('apps/mcp-worker/.wrangler/')) continue;
  if (rel.includes('/node_modules/')) continue;
  const text = readFileSync(file, 'utf8');
  for (const re of BAD) {
    if (re.test(text)) hits.push(`${rel}: ${re}`);
  }
}

if (hits.length) {
  console.error('Portfolio preflight — possible secrets:\n' + hits.join('\n'));
  process.exit(1);
}
console.log('✓ Portfolio preflight — no live secret patterns detected');
process.exit(0);
