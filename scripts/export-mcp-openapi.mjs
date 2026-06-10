#!/usr/bin/env node
/** Export OpenAPI 3.1 stub for Iron Cannon HTTP surface */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { listToolsForTier } from '../packages/mcp-core/src/tool-catalog.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/engine/openapi/iron-cannon-mcp.openapi.json');

const tools = listToolsForTier('ironclad');

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'Iron Cannon MCP HTTP API',
    version: '0.4.0',
    description:
      'HTTP bridge for MCP tools. Primary integrators use POST /mcp (JSON-RPC). Legacy body { toolId } supported. Examples: docs/engine/mcp-clients/golden-path-rpc-examples.json',
  },
  servers: [{ url: 'https://api.ironcannon.ai' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ruleset/latest': {
      get: {
        summary: 'Current ruleset version',
        responses: {
          '200': {
            description: 'Ruleset metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    rulesetVersion: { type: 'string' },
                    engine: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/webhooks/stripe': {
      post: {
        summary: 'Stripe platform billing webhooks (Iron Cannon subscriptions)',
        description:
          'Requires STRIPE_WEBHOOK_SECRET. Returns 501 when secret unset. Verifies Stripe-Signature header.',
        parameters: [
          {
            name: 'stripe-signature',
            in: 'header',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '200': { description: 'Event processed (idempotent)' },
          '400': { description: 'Invalid signature or JSON' },
          '501': { description: 'NOT_CONFIGURED — webhook secret missing' },
        },
      },
    },
    '/tools': {
      get: {
        summary: 'List tools for tier',
        parameters: [
          {
            name: 'x-ironcannon-tier',
            in: 'header',
            schema: { type: 'string', enum: ['pro', 'armor', 'ironclad'] },
          },
        ],
        responses: { '200': { description: 'Tool catalog slice' } },
      },
    },
    '/mcp': {
      post: {
        summary: 'MCP JSON-RPC or legacy tool invoke',
        parameters: [
          { name: 'x-ironcannon-tier', in: 'header', schema: { type: 'string' } },
          { name: 'x-ironcannon-client', in: 'header', schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
              examples: {
                toolsList: {
                  value: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
                },
                toolsCall: {
                  value: {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/call',
                    params: {
                      name: 'get_module_directives',
                      arguments: { moduleId: 'M12-stripe-webhook' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'JSON-RPC result or legacy tool payload' },
          '401': { description: 'AUTH_MISSING / AUTH_INVALID' },
          '402': { description: 'SUBSCRIPTION_INACTIVE' },
          '403': { description: 'TIER_INSUFFICIENT' },
          '429': { description: 'RATE_LIMIT_EXCEEDED' },
        },
      },
    },
  },
  components: {
    schemas: Object.fromEntries(
      tools.map((t) => [
        t.id,
        {
          type: 'object',
          description: t.description,
          ...t.inputSchema,
        },
      ]),
    ),
  },
  'x-ironcannon-tools': tools.map((t) => ({
    id: t.id,
    name: t.name,
    tierMin: t.tierMin,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
};

mkdirSync(join(ROOT, 'docs/engine/openapi'), { recursive: true });
writeFileSync(OUT, JSON.stringify(spec, null, 2) + '\n');
console.log(`✓ OpenAPI export — ${tools.length} tools → ${OUT}`);
process.exit(0);
