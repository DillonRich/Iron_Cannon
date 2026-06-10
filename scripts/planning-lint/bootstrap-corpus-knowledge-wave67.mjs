#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const MICRO = [
  ['owasp', 'mcp-tool-scope', 'Authorize each MCP tool call; deny env/shell tools without explicit policy'],
  ['owasp', 'rag-chunk-validate', 'Validate retrieved RAG chunks for injection markers before compose'],
  ['owasp', 'agent-tool-policy', 'AI agent tool allowlist blocks filesystem and credential exfiltration'],
  ['cloudflare', 'workers-secret-binding', 'Store API keys in Workers secrets bindings; never commit to git'],
  ['stripe', 'dispute-evidence-sla', 'Submit Stripe dispute evidence within card network deadline windows'],
  ['resend', 'webhook-signature-verify', 'Verify Resend webhook HMAC before processing bounce events'],
  ['nextjs', 'server-client-data-boundary', 'Keep secrets server-side; never expose tokens in client bundles'],
  ['ironcannon', 'production-confidence-gate', 'Run g2:production-confidence before production MCP release tag'],
  ['ironcannon', 'phase3-expand-test', 'Phase 3 loop: expand knowledge + grow PC scenarios every wave'],
  ['legal', 'refund-checkout-disclosure', 'Show refund policy link on checkout review step before pay'],
];

mkdirSync(REF, { recursive: true });
const existingRef = new Set();
for (const f of readdirSync(REF)) {
  if (!f.endsWith('.specimen.json')) continue;
  const c = JSON.parse(readFileSync(join(REF, f), 'utf8'));
  if (c.refId) existingRef.add(c.refId);
}

let added = 0;
for (const [provider, slug, excerpt] of MICRO) {
  const refId = `${provider}/knowledge-w67-${slug}`;
  if (existingRef.has(refId)) continue;
  writeFileSync(
    join(REF, `${provider}-knowledge-w67-${slug}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/knowledge/w67/${slug}`,
        lastVerified: '2026-06-06',
        title: `W67 ${slug}`,
        provider,
        excerpt,
        embeddingHint: `${provider} ${slug} wave67 phase3 production`,
        tags: ['wave67', 'knowledge', provider, 'phase3'],
      },
      null,
      2,
    ) + '\n',
  );
  added += 1;
}
console.log(`✓ Knowledge wave67 corpus — ${added} micro cards added`);
