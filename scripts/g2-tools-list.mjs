#!/usr/bin/env node
import { listToolsForTier } from '../packages/mcp-core/src/tool-catalog.js';
import { handleMcpJsonRpc, formatJsonRpcResponse } from '../packages/mcp-core/src/mcp-handler.js';

const pro = listToolsForTier('pro');
if (pro.length !== 8) {
  console.error(`pro tools expected 8 got ${pro.length}`);
  process.exit(1);
}

const iron = listToolsForTier('ironclad');
if (iron.length !== 14) {
  console.error(`ironclad tools expected 14 got ${iron.length}`);
  process.exit(1);
}

const rpc = await handleMcpJsonRpc(
  { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
  { tier: 'armor' },
);
const { body } = formatJsonRpcResponse(rpc);
if (!body.result?.tools?.length || body.result.tools.length !== 11) {
  console.error('tools/list armor failed', body);
  process.exit(1);
}

const init = await handleMcpJsonRpc({ jsonrpc: '2.0', id: 2, method: 'initialize', params: {} }, {});
const initBody = formatJsonRpcResponse(init).body;
if (!initBody.result?.serverInfo?.name) {
  console.error('initialize failed');
  process.exit(1);
}

console.log('✓ G-2 tools/list — pro=8 armor=11 ironclad=14 + initialize');
process.exit(0);
