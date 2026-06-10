#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PATHS } from './lib/paths.mjs';
import { parseLlmsMarkdown, hostAllowed } from './lib/parse-llms.mjs';

const registry = JSON.parse(readFileSync(PATHS.registry, 'utf8'));
mkdirSync(PATHS.inventory, { recursive: true });

async function fetchText(url, etag) {
  const headers = { 'User-Agent': 'IronCannon-CorpusHarvest/1.0 (+planning)' };
  if (etag) headers['If-None-Match'] = etag;
  const res = await fetch(url, { headers });
  if (res.status === 304) return { status: 304 };
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return { status: res.status, text: await res.text(), etag: res.headers.get('etag') };
}

const allLinks = [];

for (const [provider, cfg] of Object.entries(registry.providers)) {
  const urls = [cfg.llmsTxt, ...(cfg.subRegistries ?? [])].filter(Boolean);
  const providerLinks = [];

  for (const url of urls) {
    try {
      const r = await fetchText(url, registry.etags?.[provider]);
      if (r.status === 304) {
        console.log(`  ${provider}: ${url} not modified`);
        continue;
      }
      if (r.etag) registry.etags[provider] = r.etag;
      const parsed = parseLlmsMarkdown(r.text, provider).filter((l) =>
        hostAllowed(l.url, registry.allowlistHosts),
      );
      providerLinks.push(...parsed);
      console.log(`  ${provider}: ${parsed.length} links from ${url}`);
    } catch (e) {
      console.warn(`  ${provider}: skip ${url} — ${e.message}`);
      if (cfg.llmsTxtFallback && url === cfg.llmsTxt) {
        try {
          const fb = await fetchText(cfg.llmsTxtFallback);
          const parsed = parseLlmsMarkdown(fb.text, provider);
          providerLinks.push(...parsed);
          console.log(`  ${provider}: fallback ${parsed.length} links`);
        } catch (e2) {
          console.warn(`  ${provider}: fallback failed — ${e2.message}`);
        }
      }
    }
  }

  const dedup = new Map();
  for (const l of providerLinks) dedup.set(l.url, l);
  const links = [...dedup.values()];
  writeFileSync(join(PATHS.inventory, `${provider}.json`), JSON.stringify({ synced: new Date().toISOString(), count: links.length, links }, null, 2) + '\n', 'utf8');
  allLinks.push(...links);
}

writeFileSync(PATHS.registry, JSON.stringify(registry, null, 2) + '\n', 'utf8');
writeFileSync(
  join(PATHS.inventory, '_all.json'),
  JSON.stringify({ synced: new Date().toISOString(), count: allLinks.length }, null, 2) + '\n',
  'utf8',
);
console.log(`✓ Registry sync — ${allLinks.length} total links across providers`);
