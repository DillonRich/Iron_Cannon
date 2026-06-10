#!/usr/bin/env node
/**
 * Full golden path via handleMcpJsonRpc (no HTTP) — JSON-RPC contract proof.
 */
import { handleMcpJsonRpc, formatJsonRpcResponse } from '../packages/mcp-core/src/mcp-handler.js';

const errors = [];

async function call(id, method, params = {}, extra = {}) {
  const handled = await handleMcpJsonRpc(
    { jsonrpc: '2.0', id, method, params },
    { tier: 'pro', clientKey: 'golden-protocol', ...extra },
  );
  const { body } = formatJsonRpcResponse(handled);
  if (body.error) return { ok: false, error: body.error, body };
  return { ok: true, result: body.result };
}

const init = await call(0, 'initialize', {});
if (!init.ok || !init.result?.serverInfo?.name) errors.push('initialize');

const list = await call(1, 'tools/list', {});
if (!list.ok || (list.result?.tools?.length ?? 0) < 8) errors.push('tools/list');

const t01 = await call(2, 'tools/call', {
  name: 'analyze_project_stack',
  arguments: { fixtureId: 'SD-01' },
});
if (!t01.ok || !t01.result?.stack?.supported) errors.push('T01');

const t02 = await call(3, 'tools/call', {
  name: 'validate_stack_completeness',
  arguments: { stack: t01.result.stack },
});
if (!t02.ok || !t02.result?.complete) errors.push('T02');

const t03 = await call(4, 'tools/call', {
  name: 'generate_system_wiremap',
  arguments: { flowIds: ['auth-lifecycle', 'billing-subscription'] },
});
const att = t03.result?.wiremapAttestation;
const modules = t03.result?.wiremaps?.[0]?.moduleIds ?? [];
if (!t03.ok || modules.length !== 12 || !att?.token) errors.push('T03');

const t04 = await call(5, 'tools/call', {
  name: 'get_module_directives',
  arguments: { moduleId: 'M12-stripe-webhook', wiremapAttestation: att },
});
if (!t04.ok || !t04.result?.slice) errors.push('T04');
if (!t04.result?.meta?.telemetry?.requestId) errors.push('T04 telemetry');

const t05 = await call(6, 'tools/call', {
  name: 'verify_module_compliance',
  arguments: { moduleId: 'M12-stripe-webhook', wiremapAttestation: att },
});
if (!t05.ok || !t05.result?.compliant) errors.push('T05');

if (errors.length) {
  console.error('G-2 golden protocol:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('✓ G-2 golden protocol — initialize → tools/list → T01→T03(12) → T04/T05(M12)');
process.exit(0);
