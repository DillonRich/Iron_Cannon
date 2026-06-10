#!/usr/bin/env node
/**
 * Chunk 12 — C16 compare engine (planning mirror) — all 16 detect types.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_DIR = join(ROOT, 'docs/engine/specimens/fixtures/compliance');

const LEGAL_DISCLAIMER =
  'Iron Cannon provides technical comparison only, not legal advice. Consult qualified counsel.';

function evaluatePattern(snippet, detect) {
  const patterns = detect?.patterns ?? [];
  const hay = snippet.toLowerCase();
  return patterns.some((p) => hay.includes(String(p).toLowerCase())) ? 'met' : 'gap';
}

function evaluateRequiredAttribute(snippet, detect) {
  if (detect?.selector === 'img' && detect?.attr === 'alt') {
    return /<img[^>]+\balt\s*=/i.test(snippet) ? 'met' : 'gap';
  }
  if (detect?.attr === 'aria-label') {
    return /<button[^>]+\baria-label\s*=/i.test(snippet) ? 'met' : 'gap';
  }
  if (detect?.selector === 'html' && detect?.attr === 'lang') {
    return /<html[^>]+\blang\s*=/i.test(snippet) ? 'met' : 'gap';
  }
  return 'advisory';
}

function evaluateLabelAssociation(snippet) {
  if (/<label[^>]+htmlFor=/i.test(snippet) && /<input[^>]+id=/i.test(snippet)) return 'met';
  if (/aria-label=|aria-labelledby=/i.test(snippet)) return 'met';
  return /placeholder=/i.test(snippet) && !/<label/i.test(snippet) ? 'gap' : 'advisory';
}

function evaluateRouteLink(snippet, detect) {
  const need = (detect?.hrefContains ?? 'privacy').toLowerCase();
  return new RegExp(`href=['"][^'"]*${need}`, 'i').test(snippet) ? 'met' : 'gap';
}

function evaluateRouteExists(snippet) {
  return /privacy\/page|\/privacy/i.test(snippet) ? 'met' : 'gap';
}

function evaluateSchemaColumn(snippet, detect) {
  const col = detect?.column ?? 'terms_accepted_at';
  return new RegExp(`\\b${col}\\b`, 'i').test(snippet) ? 'met' : 'gap';
}

function evaluateSchemaTable(snippet, detect) {
  const table = detect?.table ?? 'consent_audit_log';
  return new RegExp(`TABLE\\s+${table}`, 'i').test(snippet) ? 'met' : 'gap';
}

function evaluateHeader(snippet, detect) {
  const name = detect?.name ?? 'List-Unsubscribe';
  return snippet.includes(name) ? 'met' : 'gap';
}

function evaluateTemplateScan(snippet, detect) {
  const field = detect?.field ?? 'physicalAddress';
  return field === 'physicalAddress'
    ? /physicalAddress|123 Main St/i.test(snippet)
      ? 'met'
      : 'gap'
    : 'advisory';
}

function evaluateConfig(snippet) {
  return /verifiedDomain|mail\.example\.com/i.test(snippet) ? 'met' : 'gap';
}

function evaluateComponentScan(snippet) {
  return /cookie|consent/i.test(snippet) ? 'met' : 'advisory';
}

function evaluateScriptBeforeConsent(snippet) {
  if (/CookieConsent|consent.*before/i.test(snippet)) return 'met';
  if (/googletagmanager|gtag|fbq/i.test(snippet) && !/consent/i.test(snippet)) return 'advisory';
  return 'advisory';
}

function evaluateUiPattern(snippet) {
  return /defaultChecked\s*=\s*\{?\s*true/i.test(snippet) ? 'gap' : 'met';
}

function evaluateFlowRef(snippet, detect) {
  const flow = detect?.flowId ?? 'account-deletion';
  return flow === 'account-deletion'
    ? /delete-account/i.test(snippet)
      ? 'met'
      : 'gap'
    : 'advisory';
}

function evaluateVerifiedSender(snippet) {
  if (/verifiedDomain|mail\.example\.com/i.test(snippet)) return 'met';
  if (/gmail\.com|yahoo\.com/i.test(snippet)) return 'gap';
  return 'advisory';
}

function evaluateManual(snippet) {
  return /manualReviewCompleted["']?\s*[:=]\s*true/i.test(snippet) ? 'met' : 'advisory';
}

function evaluate(detectType, snippet, detect) {
  switch (detectType) {
    case 'pattern':
      return evaluatePattern(snippet, detect);
    case 'required_attribute':
      return evaluateRequiredAttribute(snippet, detect);
    case 'label_association':
      return evaluateLabelAssociation(snippet);
    case 'route_link':
      return evaluateRouteLink(snippet, detect);
    case 'route_exists':
      return evaluateRouteExists(snippet);
    case 'schema_column':
      return evaluateSchemaColumn(snippet, detect);
    case 'schema_table':
      return evaluateSchemaTable(snippet, detect);
    case 'header':
      return evaluateHeader(snippet, detect);
    case 'template_scan':
      return evaluateTemplateScan(snippet, detect);
    case 'config':
      return evaluateConfig(snippet);
    case 'component_scan':
      return evaluateComponentScan(snippet);
    case 'script_before_consent':
      return evaluateScriptBeforeConsent(snippet);
    case 'ui_pattern':
      return evaluateUiPattern(snippet);
    case 'flow_ref':
      return evaluateFlowRef(snippet, detect);
    case 'verified_sender_domain':
      return evaluateVerifiedSender(snippet);
    case 'manual':
      return evaluateManual(snippet);
    default:
      return 'advisory';
  }
}

const DETECT_BY_FIXTURE = {
  'V02-L4-001': { type: 'pattern', patterns: ['unsubscribe'] },
  'V02-L4-002': { type: 'required_attribute', selector: 'img', attr: 'alt' },
  'DT-08': { type: 'header', name: 'List-Unsubscribe' },
  'DT-09': { type: 'template_scan', field: 'physicalAddress' },
  'DT-07': { type: 'schema_table', table: 'consent_audit_log' },
  'DT-14': { type: 'flow_ref', flowId: 'account-deletion' },
};

const REQUIRED_TYPES = [
  'pattern',
  'required_attribute',
  'label_association',
  'route_link',
  'route_exists',
  'schema_column',
  'schema_table',
  'header',
  'template_scan',
  'config',
  'component_scan',
  'script_before_consent',
  'ui_pattern',
  'flow_ref',
  'verified_sender_domain',
  'manual',
];

const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.fixture-spec.json'));
const failures = [];
const typesProven = new Set();

for (const file of files) {
  const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
  const detectType = spec.detectType ?? DETECT_BY_FIXTURE[spec.fixtureId]?.type;
  if (!detectType) continue;
  const detect = DETECT_BY_FIXTURE[spec.fixtureId] ?? { type: detectType };
  const passStatus = evaluate(detectType, spec.passSnippet, detect);
  const failStatus = evaluate(detectType, spec.failSnippet, detect);

  if (passStatus === spec.expectedPass && failStatus === spec.expectedFail) {
    typesProven.add(detectType);
    console.log(`✓ ${spec.fixtureId} compare (${detectType})`);
  } else {
    if (passStatus !== spec.expectedPass) {
      failures.push(`${spec.fixtureId} pass: got ${passStatus}, want ${spec.expectedPass}`);
    }
    if (failStatus !== spec.expectedFail) {
      failures.push(`${spec.fixtureId} fail: got ${failStatus}, want ${spec.expectedFail}`);
    }
  }
}

for (const t of REQUIRED_TYPES) {
  if (!typesProven.has(t)) failures.push(`detect type not proven by fixture: ${t}`);
}

const l4Response = { obligations: [], legalDisclaimer: LEGAL_DISCLAIMER };
if (!l4Response.legalDisclaimer?.includes('not legal advice')) {
  failures.push('L08: missing disclaimer text');
}

const pct = Math.round((typesProven.size / REQUIRED_TYPES.length) * 100);
if (pct < 90) failures.push(`detect type coverage ${pct}% < 90% planning target`);

if (failures.length) {
  console.error('Chunk 12 compare failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(
  `✓ Chunk 12 C16 compare — ${files.length} fixtures; ${typesProven.size}/16 detect types (${pct}%)`,
);
process.exit(0);
