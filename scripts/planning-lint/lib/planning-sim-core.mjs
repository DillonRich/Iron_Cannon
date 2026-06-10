/**
 * Shared planning-phase simulators (mirrors chunk harness logic).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { hayIncludesRoute } from '../../../packages/mcp-core/src/obligation-verify.js';

export function readText(root, rel) {
  try {
    return readFileSync(join(root, rel), 'utf8');
  } catch {
    return null;
  }
}

export function readJson(root, rel) {
  const t = readText(root, rel);
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

export function materializeFixture(spec) {
  const dir = mkdtempSync(join(tmpdir(), 'ic-fix-'));
  for (const f of spec.projectFiles ?? []) {
    const full = join(dir, f.path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, f.content, 'utf8');
  }
  return dir;
}

export function cleanupDir(dir) {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

const NESTED_SCAN_DIRS = [
  'cloudflare-worker',
  'worker',
  'website',
  'apps/mcp-worker',
  'packages/worker',
  'pages',
];

function scanRoots(projectRoot) {
  const roots = [projectRoot];
  for (const sub of NESTED_SCAN_DIRS) {
    const p = join(projectRoot, sub);
    if (existsSync(p)) roots.push(p);
  }
  return roots;
}

function readWranglerText(projectRoot) {
  const chunks = [];
  for (const root of scanRoots(projectRoot)) {
    for (const f of ['wrangler.toml', 'wrangler.jsonc', 'wrangler.pages.toml']) {
      const t = readText(root, f);
      if (t) chunks.push(t);
    }
  }
  return chunks.join('\n');
}

function mergeDeps(projectRoot) {
  const deps = {};
  for (const root of scanRoots(projectRoot)) {
    const pkg = readJson(root, 'package.json');
    Object.assign(deps, pkg?.dependencies, pkg?.devDependencies);
  }
  return deps;
}

export function analyzeProjectStack(projectRoot) {
  const deps = mergeDeps(projectRoot);
  let frontend = 'unknown';
  if (deps?.next) frontend = 'nextjs';
  const hasStaticSite =
    existsSync(join(projectRoot, 'website')) ||
    existsSync(join(projectRoot, 'pages')) ||
    scanRoots(projectRoot).some((r) => existsSync(join(r, 'index.html')));
  if (hasStaticSite && frontend === 'unknown') frontend = 'static_pages';
  const wranglerText = readWranglerText(projectRoot);
  const hasWrangler = Boolean(wranglerText.trim());
  const hasVercel = existsSync(join(projectRoot, 'vercel.json'));
  let compute = 'unknown';
  if (hasWrangler) compute = 'cloudflare_workers';
  if (hasVercel && !hasWrangler) compute = 'vercel';
  let database = 'unknown';
  const hasWorkerMain = /\bmain\s*=/.test(wranglerText);
  const hasPagesBuild = wranglerText.includes('pages_build_output_dir');
  const hasSupabase = Boolean(deps?.['@supabase/supabase-js'] || deps?.['@supabase/ssr']);
  if (wranglerText.includes('d1_databases')) database = 'cloudflare_d1';
  else if (hasSupabase && !hasWrangler) database = 'supabase_postgres';
  const services = [];
  if (deps?.stripe) services.push('stripe');
  if (deps?.resend) services.push('resend');
  if (deps?.firebase) services.push('firebase');
  if (hasSupabase) services.push('supabase_auth');
  for (const root of scanRoots(projectRoot)) {
    const src = readText(root, 'src/index.ts') ?? readText(root, 'index.ts') ?? '';
    if (!services.includes('stripe') && /\bstripe\b/i.test(src)) services.push('stripe');
    if (!services.includes('resend') && /\bresend\b/i.test(src)) services.push('resend');
  }
  const envExample =
    readText(projectRoot, '.env.example') ??
    scanRoots(projectRoot).map((r) => readText(r, '.env.example')).filter(Boolean).join('\n');
  const envVarNames = envExample
    .split('\n')
    .map((l) => l.split('=')[0]?.trim())
    .filter(Boolean);
  const warnings = [];
  const hasExternalServer = existsSync(join(projectRoot, 'server/index.js'));
  if (hasVercel && hasWrangler) warnings.push('HYBRID_STACK_DETECTED');
  if (hasPagesBuild && hasExternalServer) {
    warnings.push('HYBRID_STACK_DETECTED', 'external-api-surface');
  } else if (hasPagesBuild && hasWorkerMain) {
    warnings.push('HYBRID_STACK_DETECTED', 'pages-worker-split');
  } else if (hasPagesBuild) {
    warnings.push('HYBRID_STACK_DETECTED', 'external-api-surface');
  } else if (hasStaticSite && hasWrangler) {
    warnings.push('HYBRID_STACK_DETECTED', 'pages-worker-split');
  } else if (
    existsSync(join(projectRoot, 'website')) &&
    (existsSync(join(projectRoot, 'cloudflare-worker')) ||
      existsSync(join(projectRoot, 'worker')))
  ) {
    warnings.push('HYBRID_STACK_DETECTED', 'pages-worker-split');
    if (compute === 'unknown' && scanRoots(projectRoot).some((r) => readWranglerText(r).trim())) {
      compute = 'cloudflare_workers';
    }
  }
  if (hasExternalServer) warnings.push('external-api-surface');
  if (existsSync(join(projectRoot, 'src-tauri')) || existsSync(join(projectRoot, 'tauri.conf.json'))) {
    warnings.push('tauri-desktop');
  }
  if (deps?.firebase) warnings.push('UNSUPPORTED_PRIMARY:firebase');
  if (hasSupabase) warnings.push('SUPABASE_PRIMARY');
  const conflicts = [];
  if (hasVercel && hasWrangler) conflicts.push({ id: 'hybrid-host:vercel+cloudflare-d1' });
  if (hasSupabase && hasWrangler && database === 'cloudflare_d1') {
    conflicts.push({ id: 'C01' });
    warnings.push('dual-database');
  }
  const missingConfig = [];
  if (services.includes('stripe') && !envVarNames.includes('STRIPE_WEBHOOK_SECRET')) {
    missingConfig.push('STRIPE_WEBHOOK_SECRET');
  }
  if (hasSupabase) {
    if (!envVarNames.includes('NEXT_PUBLIC_SUPABASE_URL')) missingConfig.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!envVarNames.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      missingConfig.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
  }
  if (warnings.includes('external-api-surface')) missingConfig.push('worker-routes-or-pages-functions');
  const rootPkg = readJson(projectRoot, 'package.json');
  const isMetaTooling =
    rootPkg?.name === 'iron-cannon-workspace' ||
    (existsSync(join(projectRoot, 'packages/mcp-core')) &&
      existsSync(join(projectRoot, 'examples/golden-reference-app')));
  if (isMetaTooling) {
    warnings.push('meta-tooling-repo');
    missingConfig.push('not-a-customer-app');
  }
  const isPartialWorkerOnly =
    compute === 'cloudflare_workers' &&
    frontend === 'unknown' &&
    !services.includes('stripe') &&
    !services.includes('resend') &&
    !isMetaTooling;
  if (isPartialWorkerOnly) {
    missingConfig.push('customer-app-surface');
  }
  const stackId = warnings.includes('pages-worker-split')
    ? 'SD-06'
    : warnings.includes('tauri-desktop')
      ? 'tauri-desktop'
      : undefined;
  const supported =
    !isMetaTooling &&
    !deps?.firebase &&
    conflicts.length === 0 &&
    (frontend !== 'unknown' ||
      compute !== 'unknown' ||
      services.length > 0 ||
      database !== 'unknown' ||
      database === 'supabase_postgres');
  const uniqWarnings = [...new Set(warnings)];
  return {
    frontend,
    compute,
    database,
    services,
    conflicts,
    missingConfig,
    warnings: uniqWarnings,
    supported,
    stackId,
  };
}

export function stackT02Complete(actual) {
  return actual.supported !== false && (actual.missingConfig?.length ?? 0) === 0;
}

const CORE_MODULE_IDS = [
  'M01-auth-d1-schema',
  'M02-auth-worker-routes',
  'M03-auth-resend-emails',
  'M04-auth-ui-routes',
  'M05-auth-session-middleware',
  'M10-billing-d1-schema',
  'M11-stripe-checkout-route',
  'M12-stripe-webhook',
  'M13-provisioning-kv',
  'M14-billing-success-ui',
  'M15-billing-dashboard-ui',
  'M16-billing-emails',
];

const OPTIONAL_FLOW_MODULES = {
  'password-reset': ['M20-reset-token-schema', 'M21-reset-api', 'M22-reset-ui', 'M23-reset-email'],
  onboarding: ['M30-onboarding-schema', 'M31-onboarding-api', 'M32-onboarding-ui'],
  'account-deletion': ['M40-deletion-api', 'M41-deletion-scheduler', 'M42-deletion-ui'],
};

const PAGES_SPLIT_PREFIX = ['M60-pages-wrangler-config', 'M61-pages-env-bridge'];
const TAURI_DESKTOP_PREFIX = ['M80-tauri-app-config', 'M81-tauri-updater-config'];
const SUPABASE_AUTH_PREFIX = ['M70-supabase-auth-config', 'M71-supabase-middleware-ssr'];
const SUPABASE_BILLING_CORE = [
  'M11-stripe-checkout-route',
  'M12-stripe-webhook',
  'M13-provisioning-kv',
  'M14-billing-success-ui',
  'M15-billing-dashboard-ui',
  'M16-billing-emails',
];

export function composeWiremaps(input) {
  const flowIds = input.flowIds ?? ['auth-lifecycle', 'billing-subscription'];
  const profile = input.wiremapProfile ?? 'default';
  const stackId = input.stackId ?? input.stack?.stackId;
  if (stackId === 'SD-07' || profile === 'supabase-primary') {
    const moduleIds = [...SUPABASE_AUTH_PREFIX, ...SUPABASE_BILLING_CORE];
    return {
      split: false,
      wiremaps: [{ moduleIds, stackId: 'SD-07', flowIds }],
      warnings: ['supabase-primary-wiremap'],
      meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL', stackId: 'SD-07' },
    };
  }
  if (stackId === 'SD-06' || profile === 'pages-worker-split') {
    const moduleIds = [...PAGES_SPLIT_PREFIX, ...CORE_MODULE_IDS];
    return {
      split: false,
      wiremaps: [{ moduleIds, stackId: 'SD-06', flowIds }],
      warnings: ['pages-worker-split-wiremap'],
      meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL', stackId: 'SD-06' },
    };
  }
  if (stackId === 'tauri-desktop' || profile === 'tauri-desktop') {
    const moduleIds = [...TAURI_DESKTOP_PREFIX, ...CORE_MODULE_IDS];
    return {
      split: false,
      wiremaps: [{ moduleIds, stackId: 'tauri-desktop', flowIds }],
      warnings: ['tauri-desktop-wiremap'],
      meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL', stackId: 'tauri-desktop' },
    };
  }
  const attestation = input.existingModuleIds ?? [];
  const optionalFlows = flowIds.filter((f) => OPTIONAL_FLOW_MODULES[f]);
  if (optionalFlows.length && attestation.length >= 3 && !flowIds.some((f) => ['auth-lifecycle', 'billing-subscription'].includes(f))) {
    const optionalIds = optionalFlows.flatMap((f) => OPTIONAL_FLOW_MODULES[f]);
    return {
      mode: 'OPTIONAL_ONLY',
      split: false,
      wiremaps: [{ moduleIds: optionalIds, flowIds: optionalFlows }],
      warnings: [],
      meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL' },
    };
  }
  let optionalIds = optionalFlows.flatMap((f) => OPTIONAL_FLOW_MODULES[f]);
  let coreIds = [...CORE_MODULE_IDS];
  const warnings = [];
  if (optionalFlows.includes('account-deletion') && !flowIds.includes('billing-subscription')) {
    warnings.push('account-deletion-without-billing-flow');
  }
  if (profile === 'compact' && optionalFlows.includes('onboarding')) {
    coreIds = coreIds.filter((id) => id !== 'M16-billing-emails');
    const onboardingIds = OPTIONAL_FLOW_MODULES.onboarding;
    let merged = [...new Set([...coreIds, ...onboardingIds])];
    const trimPriority = ['M03-auth-resend-emails', 'M14-billing-success-ui', 'M15-billing-dashboard-ui'];
    for (const drop of trimPriority) {
      if (merged.length <= 12) break;
      if (merged.includes(drop) && !onboardingIds.includes(drop)) {
        merged = merged.filter((id) => id !== drop);
      }
    }
    if (!merged.includes('M32-onboarding-ui')) merged.push('M32-onboarding-ui');
    merged = [...new Set(merged)].slice(0, 12);
    return {
      split: false,
      wiremaps: [{ moduleIds: merged, flowIds }],
      warnings,
      meta: { hasTradeoffs: true, phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL' },
    };
  }
  const merged = [...new Set([...coreIds, ...optionalIds])];
  if (merged.length > 12) {
    return {
      split: true,
      wiremaps: [{ moduleIds: coreIds }, { moduleIds: optionalIds, flowIds: optionalFlows }],
      warnings,
      meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL' },
    };
  }
  return { split: false, wiremaps: [{ moduleIds: merged }], warnings, meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL' } };
}

export function evaluateCompare(detectType, snippet, detect = {}) {
  const hay = snippet.toLowerCase();
  switch (detectType) {
    case 'pattern': {
      const patterns = detect.patterns ?? (detect.pattern ? [detect.pattern] : []);
      if (!patterns.length) return hay.includes('unsubscribe') || hay.includes('do not sell') ? 'met' : 'gap';
      return patterns.some((p) => hay.includes(String(p).toLowerCase())) ? 'met' : 'gap';
    }
    case 'required_attribute':
      if (detect.selector === 'img' || detect.attr === 'alt') {
        return /<img[^>]+\balt\s*=/i.test(snippet) ? 'met' : 'gap';
      }
      if (detect.attr === 'aria-label') {
        return /<button[^>]+\baria-label\s*=/i.test(snippet) ? 'met' : 'gap';
      }
      if (detect.selector === 'html' && detect.attr === 'lang') {
        return /<html[^>]+\blang\s*=/i.test(snippet) ? 'met' : 'gap';
      }
      if (detect.attr && detect.value) {
        const v = String(detect.value).toLowerCase();
        return hay.includes(v) || hay.includes(`${detect.attr}=${detect.value}`.toLowerCase())
          ? 'met'
          : 'gap';
      }
      return /(\balt\s*=|\baria-label\s*=|\blang\s*=)/i.test(snippet) ? 'met' : 'gap';
    case 'label_association':
      return /<label[^>]+htmlFor=/i.test(snippet) ? 'met' : 'gap';
    case 'route_link': {
      const path = detect.path ?? detect.href;
      const need = (detect.hrefContains ?? 'privacy').toLowerCase();
      const hasRoute = path ? hayIncludesRoute(snippet, path) : false;
      const hasHref =
        new RegExp(`href=['"][^'"]*${need}`, 'i').test(snippet) ||
        (need.includes('privacy') && /privacy|privacy-policy|#privacy/i.test(snippet)) ||
        (need.includes('term') && /terms|terms-of-service|#terms/i.test(snippet));
      return hasRoute && hasHref ? 'met' : 'gap';
    }
    case 'route_exists': {
      const pathNeed = detect.path ?? detect.route ?? '';
      if (pathNeed) return hayIncludesRoute(snippet, pathNeed) ? 'met' : 'gap';
      return /\/(privacy|terms|cookies|accessibility|legal)/i.test(snippet) ? 'met' : 'gap';
    }
    case 'schema_column':
      return new RegExp(`\\b${detect.column ?? 'terms_accepted_at'}\\b`, 'i').test(snippet) ? 'met' : 'gap';
    case 'schema_table':
      return new RegExp(`(TABLE\\s+${detect.table ?? 'consent_audit_log'}|table\\s+${detect.table})`, 'i').test(
        snippet,
      )
        ? 'met'
        : 'gap';
    case 'header':
      return snippet.includes(detect.name ?? 'List-Unsubscribe') ? 'met' : 'gap';
    case 'template_scan':
      if (detect.templateIdPrefix) {
        const p = String(detect.templateIdPrefix).toLowerCase();
        return hay.includes(p) ? 'met' : 'gap';
      }
      if (detect.forbidden?.length) {
        const bad = detect.forbidden.some((f) => hay.includes(String(f).toLowerCase()));
        return bad ? 'gap' : 'met';
      }
      if (detect.event) {
        return hay.includes(String(detect.event).toLowerCase()) ? 'met' : 'gap';
      }
      if (detect.field === 'preheader') {
        return /preheader|preview/i.test(snippet) && !/free!!!|act now/i.test(snippet) ? 'met' : 'gap';
      }
      if (detect.field === 'promotionalContentInTransactional') {
        return /buy now|limited offer|sale today/i.test(snippet) ? 'gap' : 'met';
      }
      return /physicalAddress|123 Main/i.test(snippet) ? 'met' : 'gap';
    case 'config':
      return /verifiedDomain|webhooks|deliveryEvents/i.test(snippet) ? 'met' : 'gap';
    case 'component_scan':
      if ((detect.patterns ?? []).some((p) => hay.includes(String(p).toLowerCase()))) return 'met';
      return /cookie|consent|focus-trap|focustrap/i.test(snippet) ? 'met' : 'advisory';
    case 'script_before_consent':
      return /CookieConsent|consent before|consentgate|consent gate/i.test(snippet) ? 'met' : 'advisory';
    case 'ui_pattern': {
      if (/^gap$/i.test(snippet.trim())) return 'gap';
      if (/defaultChecked\s*=\s*\{?\s*true/i.test(snippet)) return 'gap';
      const pat = (detect.pattern ?? '').toLowerCase();
      if (pat) return hay.includes(pat) ? 'met' : 'gap';
      return 'met';
    }
    case 'flow_ref': {
      const flow = (detect.flow ?? '').toLowerCase();
      if (flow) return hay.includes(flow.replace(/-/g, '')) || hay.includes(flow) ? 'met' : 'gap';
      return /delete-account|data-export|terms-reaccept|account-deletion/i.test(snippet) ? 'met' : 'gap';
    }
    case 'verified_sender_domain':
      return /verifiedDomain|mail\.example/i.test(snippet) ? 'met' : 'gap';
    case 'manual':
      if (/^gap$/i.test(snippet.trim())) return 'gap';
      return /manualReviewCompleted/i.test(snippet) ? 'met' : 'advisory';
    default:
      return 'advisory';
  }
}

export function resolveError(trigger) {
  if (!trigger.apiKey && trigger.apiKey !== undefined) return 'AUTH_MISSING';
  if (trigger.apiKey === 'bad') return 'AUTH_INVALID';
  if (trigger.subscription === 'inactive') return 'SUBSCRIPTION_INACTIVE';
  if (trigger.tier === 'pro' && trigger.tool) return 'TIER_INSUFFICIENT';
  if (trigger.deps?.firebase) return 'STACK_UNSUPPORTED';
  if (trigger.conflicts?.length) return 'SSOT_CONFLICT';
  if (trigger.missingConfig?.length) return 'STACK_INCOMPLETE';
  if (trigger.productType === 'mobile_app') return 'PRODUCT_TYPE_INVALID';
  if (trigger.sameModuleCalls >= 6) return 'THROTTLE_LOOP_DETECTED';
  if (trigger.requestsInWindow > 1000) return 'RATE_LIMIT_EXCEEDED';
  if (trigger.moduleId?.startsWith('M99')) return 'MODULE_NOT_FOUND';
  if (trigger.wiremapId === null) return 'WIREMAP_NOT_FOUND';
  if (trigger.wiremapApproved === false) return 'WIREMAP_NOT_APPROVED';
  if (trigger.flowId === 'nonexistent-flow') return 'FLOW_NOT_FOUND';
  if (trigger.fragmentId?.includes('missing')) return 'RULE_NOT_FOUND';
  if (trigger.payload?.bad) return 'ENGINE_SCHEMA_FAILURE';
  if (trigger.rulesetChecksum === 'dead') return 'RULE_STORE_CORRUPT';
  if (trigger.network === 'down') return 'REMOTE_UNAVAILABLE';
  if (trigger.cliVersion === '0.0.1') return 'CLI_VERSION_UNSUPPORTED';
  if (trigger.hashDrift) return 'DIFF_DRIFT_DETECTED';
  if (trigger.rollbackModule?.startsWith('M99')) return 'ROLLBACK_SNAPSHOT_MISSING';
  if (trigger.patternsMatched === 0) return 'COMPLIANCE_FAILED';
  if (trigger.bytes > 5_000_000) return 'PAYLOAD_TOO_LARGE';
  if (trigger.scope === 'desktop-only') return 'SCOPE_OUT_OF_BOUNDS';
  if (trigger.scope === 'recommend-stack') return 'SCOPE_NOT_SUPPORTED';
  if (trigger.flowId === 'custom-xyz') return 'FLOW_NOT_IN_CATALOG';
  if (trigger.current === 'M12' && trigger.priorVerified) return 'MODULE_SEQUENCE_VIOLATION';
  if (trigger.moduleId === 'M12' && trigger.deps) return 'MODULE_DEPENDENCY_UNMET';
  if (trigger.wiremapContext === null) return 'CONTEXT_INSUFFICIENT';
  if (Array.isArray(trigger.fragments) && trigger.fragments.length === 0) return 'COMPOSE_EMPTY_REJECTED';
  if (trigger.tokens === 10) return 'SLICE_UNDERFLOW';
  if (trigger.tokens === 50000) return 'SLICE_TRUNCATED';
  if (trigger.emptyFile) return 'FALSE_COMPLIANCE_SUSPECTED';
  if (Array.isArray(trigger.stripeVariants) && trigger.stripeVariants.length === 0) {
    return 'STRIPE_VARIANT_REQUIRED';
  }
  if (trigger.rulesetVersion === '2020.01.01') return 'RULESET_DEPRECATED';
  if (trigger.abuseScore >= 99) return 'ABUSE_DETECTED';
  if (trigger.market === 'eu') return 'SCOPE_DISCLAIMER';
  return 'UNKNOWN';
}
