/**
 * Iron Cannon MCP Worker — https://api.ironcannon.ai/mcp
 */
import { handleMcpJsonRpc, formatJsonRpcResponse } from '@ironcannon/mcp-core/mcp-handler';
import { parseMcpRequest, formatMcpResponse } from './mcp-protocol.js';
import { ensureEngineData } from './init-engine.js';
import { getRulesetVersion } from '@ironcannon/mcp-core/ruleset';
import { randomUUID } from 'crypto';
import { handleStripePlatformWebhook } from './platform-webhook.js';
import { flushUsageBufferToD1 } from '@ironcannon/mcp-core';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, x-ironcannon-tier, x-ironcannon-client, x-ironcannon-api-key',
};

function json(data, status = 200, extra = {}) {
  return Response.json(data, { status, headers: { ...CORS_HEADERS, ...extra } });
}

function requestMeta(request, env) {
  return {
    requestId: request.headers.get('x-request-id') ?? randomUUID(),
    authorization: request.headers.get('Authorization'),
    headers: {
      authorization: request.headers.get('Authorization'),
      'x-ironcannon-api-key': request.headers.get('x-ironcannon-api-key'),
    },
    env,
    requireApiKey: env?.REQUIRE_API_KEY === '1',
  };
}

export default {
  async fetch(request, env) {
    await ensureEngineData();
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({
        ok: true,
        service: 'iron-cannon-mcp',
        rulesetVersion: getRulesetVersion(),
        domain: env?.IRON_CANNON_DOMAIN ?? 'ironcannon.ai',
        engine: 'g2-mcp-protocol',
        endpoints: ['/health', '/mcp', '/tools', '/v1/ruleset/latest', '/webhooks/stripe'],
      });
    }

    if (url.pathname === '/v1/ruleset/latest' && request.method === 'GET') {
      return json({
        ok: true,
        rulesetVersion: getRulesetVersion(),
        engine: 'g2-mcp-protocol',
      });
    }

    if (url.pathname === '/webhooks/stripe' && request.method === 'POST') {
      return handleStripePlatformWebhook(request, env);
    }

    if (url.pathname === '/tools' && request.method === 'GET') {
      const tier = request.headers.get('x-ironcannon-tier') ?? 'pro';
      const { listToolsForTier } = await import('@ironcannon/mcp-core/tool-catalog');
      return json({ ok: true, tier, tools: listToolsForTier(tier) });
    }

    if (url.pathname === '/mcp' && request.method === 'POST') {
      const tier = request.headers.get('x-ironcannon-tier') ?? 'pro';
      const meta = requestMeta(request, env);
      const raw = await request.json().catch(() => ({}));

      if (raw?.jsonrpc === '2.0' && raw.method) {
        const handled = await handleMcpJsonRpc(raw, {
          tier,
          clientKey: request.headers.get('x-ironcannon-client') ?? 'anonymous',
          env,
          rateLimitKv: env?.RATE_LIMIT_KV,
          requestId: meta.requestId,
          authorization: meta.authorization,
          headers: meta.headers,
        requireApiKey: meta.requireApiKey,
        sessionKv: env?.SESSION_KV,
        deferUsage: !!env?.DB,
      });
        const { body, status } = formatJsonRpcResponse(handled);
        return json(body, status, { 'x-request-id': meta.requestId });
      }

      const { rpcId, toolId, ctx } = parseMcpRequest(raw);
      const { invokeTool } = await import('@ironcannon/mcp-core');
      const result = await invokeTool(toolId, {
        tier,
        clientKey: request.headers.get('x-ironcannon-client') ?? 'anonymous',
        rateLimitKv: env?.RATE_LIMIT_KV,
        vectorize: env?.VECTORIZE,
        requestId: meta.requestId,
        authorization: meta.authorization,
        headers: meta.headers,
        requireApiKey: meta.requireApiKey,
        env,
        d1: env?.DB,
        sessionKv: env?.SESSION_KV,
        deferUsage: !!env?.DB,
        ...ctx,
      });
      const httpStatus = result.ok
        ? 200
        : result.error === 'TIER_INSUFFICIENT'
          ? 403
          : result.error === 'SUBSCRIPTION_INACTIVE'
            ? 402
          : result.error === 'AUTH_MISSING' || result.error === 'AUTH_INVALID'
            ? 401
            : 400;
      const { body, status } = formatMcpResponse(rpcId, result, httpStatus);
      return json(body, status, { 'x-request-id': meta.requestId });
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  },

  async scheduled(event, env, ctx) {
    if (!env?.DB) return;
    ctx.waitUntil(
      flushUsageBufferToD1(env.DB).catch(() => {}),
    );
  },
};
