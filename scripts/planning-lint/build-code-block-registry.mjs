#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const out = join(ROOT, 'docs/engine/planning/code-block-registry.json');
const blocks = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'specimens' || name === 'node_modules') continue;
      walk(full);
      continue;
    }
    if (!name.endsWith('.md')) continue;
    const rel = full.replace(/\\/g, '/').replace(ROOT.replace(/\\/g, '/') + '/', '');
    const text = readFileSync(full, 'utf8');
    const re = /```(\w+)?\r?\n([\s\S]*?)```/g;
    let m;
    let i = 0;
    while ((m = re.exec(text)) !== null) {
      const lang = (m[1] || 'plain').toLowerCase();
      const body = m[2].trim();
      if (body.length < 6) continue;
      blocks.push({
        id: `CB-${blocks.length + 1}`,
        source: rel,
        index: i++,
        lang,
        lines: body.split(/\r?\n/).length,
        hash: createHash('sha256').update(body).digest('hex').slice(0, 16),
      });
    }
  }
}

walk(join(ROOT, 'docs/engine'));
if (existsSync(join(ROOT, 'docs/clients'))) walk(join(ROOT, 'docs/clients'));

writeFileSync(
  out,
  JSON.stringify({ version: '1.0.0', blockCount: blocks.length, blocks }, null, 2) + '\n',
);
console.log(`✓ Code block registry — ${blocks.length} blocks`);
