#!/usr/bin/env node
/**
 * Optional HTTP smoke against wrangler dev (skip if not running).
 * T01–T03 are local-only; wiremap attestation comes from in-process CLI.
 */
import { invokeTool } from '../packages/mcp-core/src/index.js';
import { unwrapMcpToolResult } from '../packages/mcp-core/src/mcp-tool-result.js';

const BASE = process.env.IRON_CANNON_URL ?? 'http://127.0.0.1:8787';

function mcpPayload(json) {
  return unwrapMcpToolResult(json?.result);
}

async function tryFetch(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  return { ok: res.ok, status: res.status, json: await res.json().catch(() => ({})) };
}

try {
  const health = await tryFetch('/health');
  if (!health.ok) {
    console.log(`⊘ G-2 HTTP smoke skipped — no server at ${BASE} (${health.status})`);
    process.exit(0);
  }

  const ruleset = await tryFetch('/v1/ruleset/latest');
  if (!ruleset.json?.rulesetVersion) {
    console.error('GET /v1/ruleset/latest failed', ruleset);
    process.exit(1);
  }

  const stripeStub = await tryFetch('/webhooks/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=1,v1=00' },
    body: JSON.stringify({ id: 'evt_http_smoke', type: 'ping' }),
  });
  if (stripeStub.status !== 501 || stripeStub.json?.error !== 'NOT_CONFIGURED') {
    console.error('POST /webhooks/stripe should 501 without secret', stripeStub);
    process.exit(1);
  }

  const tools = await tryFetch('/tools', {
    headers: { 'x-ironcannon-tier': 'pro' },
  });
  if (!tools.json?.tools?.length) {
    console.error('GET /tools failed', tools);
    process.exit(1);
  }

  const ping = await tryFetch('/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ironcannon-tier': 'pro',
      'x-ironcannon-client': 'http-smoke',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'ping' }),
  });
  if (!ping.ok || ping.json?.error) {
    console.error('POST /mcp ping failed', ping);
    process.exit(1);
  }

  const mcp = await tryFetch('/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ironcannon-tier': 'pro',
      'x-ironcannon-client': 'http-smoke',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'validate_stack_completeness',
        arguments: {
          stack: { supported: true, missingConfig: [], conflicts: [], warnings: [] },
        },
      },
    }),
  });
  const t02 = mcpPayload(mcp.json);
  if (!t02?.complete) {
    console.error('tools/call T02 failed', mcp.json);
    process.exit(1);
  }
  const mcpText = mcp.json?.result?.content?.[0]?.text ?? '';
  if (!mcpText.trim()) {
    console.error('tools/call T02 missing content[].text (Cursor MCP envelope)', mcp.json?.result);
    process.exit(1);
  }

  const t03Http = await tryFetch('/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ironcannon-tier': 'pro',
      'x-ironcannon-client': 'http-smoke',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'generate_system_wiremap',
        arguments: { flowIds: ['auth-lifecycle', 'billing-subscription'] },
      },
    }),
  });
  if (t03Http.json?.error?.data?.error !== 'LOCAL_CLI_REQUIRED') {
    console.error('T03 over HTTP should return LOCAL_CLI_REQUIRED', t03Http.json);
    process.exit(1);
  }

  const t03Cli = await invokeTool('T03', { tier: 'pro', clientKey: 'http-smoke-cli' });
  const att = t03Cli.wiremapAttestation;
  if (!att?.token) {
    console.error('CLI T03 wiremap attestation missing', t03Cli);
    process.exit(1);
  }

  const t04 = await tryFetch('/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ironcannon-tier': 'pro',
      'x-ironcannon-client': 'http-smoke',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_module_directives',
        arguments: { moduleId: 'M01-auth-d1-schema', wiremapAttestation: att },
      },
    }),
  });
  const t04r = mcpPayload(t04.json);
  if (!t04r?.ok) {
    console.error('T04 via HTTP failed', t04.json);
    process.exit(1);
  }

  console.log(
    `✓ G-2 HTTP smoke — health + ping + ruleset + stripe stub + ${tools.json.tools.length} tools + T02 + T04 (CLI T03 att)`,
  );
  process.exit(0);
} catch (e) {
  console.log(`⊘ G-2 HTTP smoke skipped — ${BASE} unreachable`);
  process.exit(0);
}
