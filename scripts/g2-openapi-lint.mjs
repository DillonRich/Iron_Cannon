#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PATH = join(ROOT, 'docs/engine/openapi/iron-cannon-mcp.openapi.json');

if (!existsSync(PATH)) {
  console.error('OpenAPI file missing — run npm run g2:openapi');
  process.exit(1);
}

const spec = JSON.parse(readFileSync(PATH, 'utf8'));
const requiredPaths = ['/health', '/tools', '/mcp', '/v1/ruleset/latest', '/webhooks/stripe'];
const missing = requiredPaths.filter((p) => !spec.paths?.[p]);

if (missing.length) {
  console.error('OpenAPI missing paths:', missing.join(', '));
  process.exit(1);
}

const minVersion = '0.4.0';
const ver = spec.info?.version ?? '0.0.0';
if (ver < minVersion) {
  console.error(`OpenAPI version ${ver} < ${minVersion}`);
  process.exit(1);
}

const tools = spec['x-ironcannon-tools'] ?? [];
if (tools.length < 14) {
  console.error(`expected 14 tools in extension, got ${tools.length}`);
  process.exit(1);
}

const stripePost = spec.paths['/webhooks/stripe']?.post;
if (!stripePost?.responses?.['501']) {
  console.error('/webhooks/stripe must document 501 NOT_CONFIGURED');
  process.exit(1);
}

console.log(`✓ g2-openapi-lint — v${ver}, ${requiredPaths.length} paths, ${tools.length} tools`);
process.exit(0);
