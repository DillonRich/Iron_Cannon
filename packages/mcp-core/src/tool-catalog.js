import { loadTierMatrix } from './tier-gate.js';

/** JSON Schema property with description (MCP ergonomics — models need param docs). */
function p(type, description, extra = {}) {
  return { type, description, ...extra };
}

const WIREMAP_ATT = p('object', 'Wiremap attestation object from T03 (required after wiremap approval).');

const DESCRIPTIONS = {
  T01: 'Detect frontend, database, and service stack from project files (local discovery).',
  T02: 'Validate detected stack is complete and supported for Iron Cannon golden flows.',
  T03: 'Generate auth + billing wiremap and issue wiremapAttestation for later module calls.',
  T04: 'Compose tier-redacted module directives for one wiremap module (requires wiremapAttestation).',
  T05: 'Verify module source against compliance patterns; returns compliant true/false (requires wiremapAttestation).',
  T06: 'Continuous diff check — compare state_log, disk files, and stack signals for drift.',
  T07: 'Audit a failed user flow — map symptoms and logs to recovery steps.',
  T08: 'Rollback to a prior module boundary using state_log snapshot (destructive — confirm first).',
  T09: 'Map vulnerability surfaces and infrastructure domains for Armor hardening.',
  T10: 'Security or infrastructure directives for a surfaceId (SURF-*) or domainId (INFRA-*).',
  T11: 'Production readiness gate: security checklist + infrastructure scale (requires wiremapAttestation).',
  T12: 'Map legal/compliance obligations by primary market (IronClad — not legal advice).',
  T13: 'Compliance directive for one obligationId; optional snippet for automated detect.',
  T14: 'Legal readiness advisory — confirm reviewed obligation IDs (IronClad — not legal advice).',
};

const INPUT_SCHEMAS = {
  T01: {
    type: 'object',
    properties: {
      fixtureId: p('string', 'Stack detection fixture id (e.g. SD-01) for local test harness.'),
      projectRoot: p('string', 'Absolute path to project root for live discovery (optional).'),
    },
  },
  T02: {
    type: 'object',
    properties: {
      stack: p('object', 'DetectedStack object from analyze_project_stack (T01).'),
    },
    required: ['stack'],
  },
  T03: {
    type: 'object',
    properties: {
      flowIds: p('array', 'Flow ids to compose into wiremap.', { items: { type: 'string' } }),
    },
  },
  T04: {
    type: 'object',
    properties: {
      moduleId: p('string', 'Wiremap module id (e.g. M12-stripe-webhook).'),
      completedModules: p('array', 'Module ids already verified in order.', { items: { type: 'string' } }),
      wiremapAttestation: WIREMAP_ATT,
    },
    required: ['moduleId'],
  },
  T05: {
    type: 'object',
    properties: {
      moduleId: p('string', 'Module id to verify against fixture patterns.'),
      snippet: p('string', 'Source code excerpt to verify (required for audit-grade pass; omit only for calibration).'),
      wiremapAttestation: WIREMAP_ATT,
    },
    required: ['moduleId'],
  },
  T06: {
    type: 'object',
    properties: {
      stateLogMarkdown: p('string', 'Contents of .iron_cannon/state_log.md.'),
      diskFiles: p('object', 'Map of relative path → file hash or excerpt.'),
      session: p('object', 'Session metadata (clientKey, tier).'),
      stackSignals: p('object', 'Optional fresh stack signals from T01.'),
    },
  },
  T07: {
    type: 'object',
    properties: {
      flowId: p('string', 'Failed flow id (e.g. billing-subscription).'),
      errorLog: p('string', 'Error log or stack trace excerpt.'),
      symptoms: p('string', 'Human-readable symptom summary.'),
    },
    required: ['flowId'],
  },
  T08: {
    type: 'object',
    properties: {
      moduleId: p('string', 'Module boundary to roll back to.'),
      stateLogMarkdown: p('string', 'State log snapshot to restore.'),
    },
    required: ['moduleId', 'stateLogMarkdown'],
  },
  T09: {
    type: 'object',
    properties: {
      surfaceHints: p('array', 'Hints like { type: "webhook" } or { type: "session" }.', {
        items: { type: 'object' },
      }),
      infraHints: p('array', 'Filter infrastructure domains (e.g. { type: "cache" }).', {
        items: { type: 'object' },
      }),
      includeInfrastructure: p('boolean', 'Include INFRA-* domains in response (default true).'),
    },
  },
  T10: {
    type: 'object',
    properties: {
      surfaceId: p('string', 'Security surface id (e.g. SURF-WH-001).'),
      domainId: p('string', 'Infrastructure domain id (e.g. INFRA-CACHE).'),
      productionMode: p('boolean', 'When true, omit dev-relaxed security patterns.'),
      expectedRps: p('number', 'Peak requests per second for scale directives.'),
      expectedUsers: p('number', 'Expected user scale for capacity planning.'),
    },
  },
  T11: {
    type: 'object',
    properties: {
      wiremapContext: p('object', 'Object with completedModules array from golden path.'),
      confirmedChecklistIds: p('array', 'Infra checklist item ids user confirmed manually.', {
        items: { type: 'string' },
      }),
      autoConfirmInfra: p(
        'boolean',
        'Acknowledge infra checklist from completed modules — sets infraAcknowledged only, not infraVerified (G-60).',
      ),
      verifiedInfraDomains: p('array', 'INFRA-* domain ids verified manually (required for infraReady).', {
        items: { type: 'string' },
      }),
      verifiedModules: p(
        'array',
        'Module ids verified via T05 snippet pass (auto-appended on compliant T05 when attestation cached).',
        {
          items: { type: 'string' },
        },
      ),
      wiremapAttestation: WIREMAP_ATT,
    },
  },
  T12: {
    type: 'object',
    properties: {
      primaryMarkets: p('array', 'Market codes: us, eu, uk, ca, etc.', { items: { type: 'string' } }),
    },
  },
  T13: {
    type: 'object',
    properties: {
      obligationId: p('string', 'Obligation id (e.g. LEG-A11Y-001).'),
      snippet: p('string', 'Code or template excerpt to run obligation detect against.'),
    },
    required: ['obligationId'],
  },
  T14: {
    type: 'object',
    properties: {
      primaryMarkets: p('array', 'Markets in scope for readiness audit.', { items: { type: 'string' } }),
      confirmedObligationIds: p('array', 'Obligation ids counsel/user confirmed reviewed.', {
        items: { type: 'string' },
      }),
      verifiedObligationIds: p('array', 'Obligation ids passed T13 snippet verify (G-57).', {
        items: { type: 'string' },
      }),
      autoConfirmOnT13Pass: p(
        'boolean',
        'Treat verifiedObligationIds as confirmed for readiness (default false).',
      ),
    },
  },
};

/** MCP tools/list for a tier (only tools the tier may call). */
export function listToolsForTier(tier = 'pro') {
  const matrix = loadTierMatrix();
  const rank = matrix.tierRank[tier] ?? 0;
  return matrix.tools
    .filter((t) => (matrix.tierRank[t.tierMin] ?? 99) <= rank)
    .map((t) => ({
      name: t.name,
      id: t.id,
      tierMin: t.tierMin,
      layers: t.layers,
      location: t.location,
      description: DESCRIPTIONS[t.id] ?? t.name,
      inputSchema: INPUT_SCHEMAS[t.id] ?? { type: 'object' },
    }));
}

export function toolNameToId(name) {
  const matrix = loadTierMatrix();
  const row = matrix.tools.find((t) => t.name === name || t.id === name);
  return row?.id ?? null;
}

/** Export for MCP surface audit tests. */
export function getToolCatalogMetadata() {
  return { descriptions: DESCRIPTIONS, inputSchemas: INPUT_SCHEMAS };
}
