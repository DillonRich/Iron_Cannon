/**
 * MCP tools/call result envelope — Cursor and other clients expect content[].text.
 */

export function wrapMcpToolResult(toolResult) {
  const text = JSON.stringify(toolResult ?? {}, null, 2);
  return {
    content: [{ type: 'text', text }],
    structuredContent: toolResult,
    isError: toolResult?.ok === false,
  };
}

/** Parse JSON-RPC tools/call result back to invokeTool payload (tests + HTTP probes). */
export function unwrapMcpToolResult(mcpResult) {
  if (!mcpResult || typeof mcpResult !== 'object') return mcpResult;
  if (mcpResult.structuredContent != null) return mcpResult.structuredContent;
  const raw = mcpResult.content?.[0]?.text;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
      return { ok: true, text: raw };
    }
  }
  return mcpResult;
}
