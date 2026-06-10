#!/usr/bin/env node
/** G-55/G-58 — MCP envelope + Cursor ping keepalive. */
import { handleMcpJsonRpc, formatJsonRpcResponse } from '../packages/mcp-core/src/mcp-handler.js';
import { unwrapMcpToolResult } from '../packages/mcp-core/src/mcp-tool-result.js';

const pingHandled = await handleMcpJsonRpc(
  { jsonrpc: '2.0', id: 1, method: 'ping' },
  { tier: 'pro', clientKey: 'g2-mcp-ping' },
);
const pingBody = formatJsonRpcResponse(pingHandled);
if (pingBody.body?.error || pingBody.status !== 200) {
  console.error('ping failed', pingBody);
  process.exit(1);
}

const handled = await handleMcpJsonRpc(
  {
    jsonrpc: '2.0',
    id: 42,
    method: 'tools/call',
    params: {
      name: 'validate_stack_completeness',
      arguments: { stack: { supported: true, missingConfig: [], conflicts: [], warnings: [] } },
    },
  },
  { tier: 'pro', clientKey: 'g2-mcp-envelope' },
);

const { body } = formatJsonRpcResponse(handled);
const text = body?.result?.content?.[0]?.text ?? '';
const payload = unwrapMcpToolResult(body?.result);

if (!text.trim()) {
  console.error('MCP envelope missing content[].text', body?.result);
  process.exit(1);
}
if (!payload?.complete) {
  console.error('unwrap failed', payload);
  process.exit(1);
}

console.log('✓ G-2 MCP content envelope — ping + content[].text + structuredContent');
process.exit(0);
