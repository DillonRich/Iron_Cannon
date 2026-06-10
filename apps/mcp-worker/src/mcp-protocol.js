/** JSON-RPC 2.0 + legacy toolId body for MCP POST /mcp */

const NAME_TO_TOOL = {
  analyze_project_stack: 'T01',
  validate_stack_completeness: 'T02',
  generate_system_wiremap: 'T03',
  get_module_directives: 'T04',
  verify_module_compliance: 'T05',
  run_continuous_diff_check: 'T06',
  audit_failed_flow: 'T07',
  rollback_to_module: 'T08',
  map_vulnerability_surfaces: 'T09',
  get_security_directives: 'T10',
  audit_production_readiness: 'T11',
  map_compliance_obligations: 'T12',
  get_compliance_directives: 'T13',
  audit_legal_readiness: 'T14',
};

export function parseMcpRequest(body) {
  if (body?.jsonrpc === '2.0' && body.method) {
    const params = body.params ?? {};
    const args = params.arguments ?? params;
    const toolId =
      args.toolId ?? params.toolId ?? NAME_TO_TOOL[body.method] ?? body.method?.toUpperCase?.();
    return { rpcId: body.id, toolId, ctx: args };
  }
  const toolId = body.toolId ?? body.tool ?? 'T01';
  return { rpcId: null, toolId, ctx: body };
}

export function formatMcpResponse(rpcId, result, httpStatus = 200) {
  if (rpcId === undefined || rpcId === null) {
    return { body: result, status: httpStatus };
  }
  if (!result.ok && result.error) {
    return {
      status: httpStatus,
      body: {
        jsonrpc: '2.0',
        id: rpcId,
        error: { code: -32000, message: result.message ?? result.error, data: result },
      },
    };
  }
  return {
    status: 200,
    body: { jsonrpc: '2.0', id: rpcId, result },
  };
}
