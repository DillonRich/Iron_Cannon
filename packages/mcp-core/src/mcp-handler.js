import { invokeTool } from './tools/index.js';
import { listToolsForTier, toolNameToId } from './tool-catalog.js';
import { wrapMcpToolResult } from './mcp-tool-result.js';

/**
 * Handle JSON-RPC 2.0 MCP methods: tools/list, tools/call, initialize (stub).
 */
export async function handleMcpJsonRpc(body, ctx = {}) {
  const tier = ctx.tier ?? 'pro';
  const method = body?.method;
  const rpcId = body?.id;

  if (method === 'initialize') {
    return {
      rpcId,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'iron-cannon-mcp', version: '0.3.0' },
        capabilities: { tools: { listChanged: false } },
        documentation: {
          playbook: 'docs/engine/GOLDEN_AGENT_PLAYBOOK.md',
          rpcExamples: 'docs/engine/mcp-clients/golden-path-rpc-examples.json',
          infrastructure: 'docs/engine/INFRASTRUCTURE_GUIDANCE_SCOPE.md',
        },
      },
    };
  }

  if (method === 'tools/list') {
    return {
      rpcId,
      result: { tools: listToolsForTier(tier) },
    };
  }

  if (method === 'tools/call') {
    const params = body.params ?? {};
    const toolId =
      toolNameToId(params.name) ?? params.toolId ?? ctx.toolId ?? 'T01';
    const args = params.arguments ?? params;
    const result = await invokeTool(toolId, {
      tier,
      clientKey: ctx.clientKey ?? 'anonymous',
      rateLimitKv: ctx.rateLimitKv,
      vectorize: ctx.env?.VECTORIZE ?? ctx.vectorize,
      requestId: ctx.requestId,
      authorization: ctx.authorization,
      headers: ctx.headers,
      requireApiKey: ctx.requireApiKey,
      env: ctx.env,
      d1: ctx.env?.DB,
      sessionKv: ctx.env?.SESSION_KV,
      deferUsage: ctx.deferUsage ?? !!ctx.env?.DB,
      wiremapAttestation: args.wiremapAttestation ?? ctx.wiremapAttestation,
      ...args,
    });
    return { rpcId, result: wrapMcpToolResult(result) };
  }

  if (method === 'notifications/initialized') {
    return { rpcId, result: { ok: true } };
  }

  // Cursor Streamable HTTP sends periodic ping keepalives; -32601 flips MCP red after ~5 min.
  if (method === 'ping') {
    return { rpcId, result: {} };
  }

  if (method?.startsWith('notifications/')) {
    return { rpcId, result: { ok: true } };
  }

  return {
    rpcId,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

export function formatJsonRpcResponse({ rpcId, result, error }, httpStatus = 200) {
  if (rpcId === undefined || rpcId === null) {
    return { body: result ?? error, status: httpStatus };
  }
  if (error) {
    return {
      status: httpStatus === 200 ? 400 : httpStatus,
      body: { jsonrpc: '2.0', id: rpcId, error },
    };
  }
  const payload = result?.structuredContent ?? result;
  if (payload?.ok === false && payload?.error) {
    const status =
      payload.error === 'TIER_INSUFFICIENT'
        ? 403
        : payload.error === 'SUBSCRIPTION_INACTIVE'
          ? 402
          : payload.error === 'AUTH_MISSING' || payload.error === 'AUTH_INVALID'
            ? 401
            : 400;
    return {
      status,
      body: {
        jsonrpc: '2.0',
        id: rpcId,
        error: { code: -32000, message: payload.message ?? payload.error, data: payload },
      },
    };
  }
  return {
    status: 200,
    body: { jsonrpc: '2.0', id: rpcId, result },
  };
}
