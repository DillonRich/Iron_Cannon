#!/usr/bin/env node
/**
 * Iron Cannon MCP surface audit — patterns from mcpunit / mcp-quality-gate / MCP-Scorecard.
 * Deterministic CI check on tools/list ergonomics (not external server scan).
 */
import { listToolsForTier } from '../packages/mcp-core/src/tool-catalog.js';

const MIN_DESC = 20;
const MAX_TOOLS = 20;
const DANGEROUS_NAME = /^(exec|eval|run_shell|delete_all|drop_db|get_env)$/i;

function auditProperty(path, prop, findings) {
  if (!prop || typeof prop !== 'object') return;
  if (prop.type && !prop.description) {
    findings.push({ rule: 'param_missing_description', severity: 'warning', path });
  }
  if (prop.properties) {
    for (const [k, v] of Object.entries(prop.properties)) {
      auditProperty(`${path}.${k}`, v, findings);
    }
  }
  if (prop.items?.properties) {
    for (const [k, v] of Object.entries(prop.items.properties)) {
      auditProperty(`${path}[].${k}`, v, findings);
    }
  }
}

const tools = listToolsForTier('ironclad');
const findings = [];

if (tools.length > MAX_TOOLS) {
  findings.push({ rule: 'tool_count_high', severity: 'warning', detail: `${tools.length} tools` });
}

for (const t of tools) {
  if (!t.description || t.description.length < MIN_DESC) {
    findings.push({ rule: 'tool_description_short', severity: 'error', tool: t.name });
  }
  if (DANGEROUS_NAME.test(t.name)) {
    findings.push({ rule: 'dangerous_tool_name', severity: 'error', tool: t.name });
  }
  if (!t.inputSchema || t.inputSchema.type !== 'object') {
    findings.push({ rule: 'weak_input_schema', severity: 'error', tool: t.name });
  } else {
    auditProperty(t.name, t.inputSchema, findings);
  }
  if (t.name === 'rollback_to_module' && !t.description.toLowerCase().includes('destructive')) {
    findings.push({ rule: 'destructive_without_hint', severity: 'warning', tool: t.name });
  }
}

const errors = findings.filter((f) => f.severity === 'error');
const warnings = findings.filter((f) => f.severity === 'warning');

const buckets = {
  conformance: errors.length ? 70 : 100,
  security: findings.some((f) => f.rule === 'dangerous_tool_name') ? 0 : 100,
  ergonomics: warnings.filter((w) => w.rule === 'param_missing_description').length ? 85 : 100,
  metadata: warnings.length ? 90 : 100,
};

if (errors.length) {
  console.error(
    `G-2 MCP surface audit failed (${errors.length} errors, ${warnings.length} warnings)\n` +
      errors.map((e) => `${e.rule} ${e.tool ?? e.path ?? e.detail}`).join('\n'),
  );
  process.exit(1);
}

console.log(
  `✓ G-2 MCP surface audit — ${tools.length} tools · conformance=${buckets.conformance} ergonomics=${buckets.ergonomics}`,
);
if (warnings.length) {
  console.log(`  warnings: ${warnings.length} (non-blocking)`);
}
process.exit(0);
