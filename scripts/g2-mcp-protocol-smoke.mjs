#!/usr/bin/env node
import { parseMcpRequest, formatMcpResponse } from '../apps/mcp-worker/src/mcp-protocol.js';

const req = parseMcpRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'get_module_directives',
  params: { arguments: { moduleId: 'M12-stripe-webhook' } },
});
if (req.toolId !== 'T04') {
  console.error('protocol map failed', req);
  process.exit(1);
}

const res = formatMcpResponse(1, { ok: true, toolId: 'T04' });
if (res.body.jsonrpc !== '2.0' || res.body.result?.toolId !== 'T04') {
  console.error('protocol response failed', res);
  process.exit(1);
}
console.log('✓ G-2 MCP protocol smoke — JSON-RPC map + envelope');
process.exit(0);
