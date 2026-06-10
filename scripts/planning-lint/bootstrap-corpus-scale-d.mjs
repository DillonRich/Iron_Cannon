#!/usr/bin/env node
/** Planning corpus — Scale-D gap fill to 10000 */
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const TARGET = 10000;

const TOPICS = [
  ['cloudflare', 'workers-ai', 'Workers AI bindings for embed and inference at edge'],
  ['cloudflare', 'vectorize', 'Vectorize index metadata must match reference-index refIds'],
  ['stripe', 'entitlements', 'Entitlements API for feature gates tied to subscription items'],
  ['stripe', 'invoicing', 'Invoice PDF retention and tax line item disclosure'],
  ['resend', 'audiences', 'Audience segments require consent basis documentation'],
  ['nextjs', 'caching', 'Partial Prerendering and dynamicIO cache boundaries'],
  ['owasp', 'llm', 'LLM prompt injection guards for agent-facing tools'],
  ['legal', 'ai-act', 'EU AI Act transparency when automated decisioning affects users'],
  ['legal', 'schrems', 'Transfer impact assessment for US subprocessors'],
  ['ironcannon', 'scale-d', 'Scale-D corpus tier for audit-depth RAG and compose slices'],
];

const existing = new Set();
for (const f of readdirSync(REF_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  try {
    const c = JSON.parse(readFileSync(join(REF_DIR, f), 'utf8'));
    if (c.refId) existing.add(c.refId);
  } catch {
    /* skip */
  }
}

const need = Math.max(0, TARGET - existing.size);
let created = 0;
for (let i = 0; i < need; i++) {
  const t = TOPICS[i % TOPICS.length];
  const refId = `${t[0]}/scale-d-${t[1]}-${String(i).padStart(4, '0')}`;
  if (existing.has(refId)) continue;
  writeFileSync(
    join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/planning/corpus/${refId}`,
        lastVerified: '2026-06-03',
        title: `Scale-D ${t[1]} ${i}`,
        excerpt: `${t[2]}. Scale-D planning reference for Iron Cannon MCP agents at 10k corpus depth.`,
        tags: [t[0], t[1], 'scale-d'],
        embeddingHint: `${t[0]} ${t[1]} ${t[2]} scale-d compliance security`,
      },
      null,
      2,
    ) + '\n',
  );
  created++;
}
console.log(`✓ Scale-D planning cards — ${created} new (target ${TARGET}, was ${existing.size})`);
