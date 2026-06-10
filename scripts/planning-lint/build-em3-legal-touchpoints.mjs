#!/usr/bin/env node
/** EM-3 — legal touchpoints: obligations, routes, EM-1 steps, markets, edge cases */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);
const em1 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em1-flow-steps.json'), 'utf8'),
);
const edge = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/edge-case-registry.json'), 'utf8'),
);
const tier = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/tier-entitlement-matrix.json'), 'utf8'),
);

const UI_ROUTES = [
  '/signup',
  '/login',
  '/settings',
  '/settings/billing',
  '/settings/privacy',
  '/settings/danger',
  '/checkout/success',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/privacy',
  '/terms',
  '/legal/reaccept',
  '/account/export',
  '/api/webhooks/stripe',
  '/api/webhooks/resend',
];

const VIRTUAL_SURFACES = [
  'email:template/welcome',
  'email:template/verify',
  'email:template/reset',
  'email:template/billing-receipt',
  'email:template/payment-failed',
  'email:template/marketing',
];

const ROUTE_FANOUT_PREFIXES = [
  'LEG-PRIV',
  'LEG-COOKIE',
  'LEG-TERMS',
  'LEG-A11Y',
  'LEG-EMAIL',
  'LEG-STRIPE',
  'LEG-DATA',
  'LEG-RECORD',
  'LEG-GLOBAL',
  'LEG-EDGE',
];

const BILLING_ONLY_PREFIXES = ['LEG-STRIPE'];
const DANGER_ROUTES = ['/settings/danger', '/account/export'];
const MARKETS = Object.keys(idx.marketBundles ?? {});

const touchpoints = [];
const seen = new Set();

function add(tp) {
  if (seen.has(tp.touchpointId)) return;
  seen.add(tp.touchpointId);
  touchpoints.push(tp);
}

function matchMarketPattern(obId, pattern) {
  if (pattern.endsWith('*')) return obId.startsWith(pattern.slice(0, -1));
  return obId === pattern;
}

function marketsForObligation(obId) {
  const out = [];
  for (const [market, patterns] of Object.entries(idx.marketBundles ?? {})) {
    if ((patterns ?? []).some((p) => matchMarketPattern(obId, p))) out.push(market);
  }
  return out.length ? out : ['global'];
}

function moduleForRoute(route) {
  if (route.includes('billing') || route.includes('checkout')) {
    return ['M15-billing-dashboard-ui', 'M11-stripe-checkout-route'];
  }
  if (route.includes('danger') || route.includes('export')) {
    return ['M42-deletion-ui', 'M50-export-api'];
  }
  if (route.includes('webhook')) return ['M12-stripe-webhook'];
  if (route.startsWith('email:')) return ['M03-auth-resend-emails', 'M16-billing-emails'];
  if (route.includes('forgot') || route.includes('reset')) {
    return ['M22-reset-ui', 'M23-reset-email'];
  }
  return ['M04-auth-ui-routes'];
}

function shouldFanoutRoute(ob, route) {
  const id = ob.id;
  if (BILLING_ONLY_PREFIXES.some((p) => id.startsWith(p))) {
    return (
      route.includes('billing') ||
      route.includes('checkout') ||
      route.startsWith('email:template/billing')
    );
  }
  if (id.startsWith('LEG-DATA') && DANGER_ROUTES.some((r) => route === r || route.includes('danger'))) {
    return true;
  }
  if (id.startsWith('LEG-DATA') && route.includes('export')) return true;
  return ROUTE_FANOUT_PREFIXES.some((p) => id.startsWith(p));
}

for (const ob of idx.obligations) {
  const markets = marketsForObligation(ob.id);
  add({
    touchpointId: `legal/${ob.id}`,
    obligationId: ob.id,
    phase: ob.phase ?? 'BUILD',
    uiSurfaces: ob.uiSurfaces ?? ['/signup', '/settings'],
    detectType: ob.detect?.type ?? ob.detectType,
    referenceRefIds: ob.referenceRefIds ?? (ob.sourceRefId ? [ob.sourceRefId] : []),
    agentGuidance: `Satisfy ${ob.id} before marking module complete`,
    markets,
    tierMin: ob.tier ?? 'ironclad',
  });

  for (const market of markets) {
    add({
      touchpointId: `legal/market/${market}/${ob.id}`,
      obligationId: ob.id,
      phase: 'COMPLIANCE',
      market,
      referenceRefIds: ob.sourceRefId ? [ob.sourceRefId] : [],
      agentGuidance: `T12 market ${market}: include ${ob.id} when in projectMarkets`,
    });
  }

  if (ob.tier === 'ironclad' || !ob.tier) {
    add({
      touchpointId: `legal/tier/pro-redact/${ob.id}`,
      obligationId: ob.id,
      phase: 'COMPOSE',
      tierGate: 'pro',
      agentGuidance: 'Pro T04/T05 must strip via filterComposedSlice',
      referenceRefIds: ['ironcannon/tier-compose-redaction'],
    });
  }

  for (const route of UI_ROUTES) {
    if (!shouldFanoutRoute(ob, route)) continue;
    add({
      touchpointId: `legal${route}/${ob.id}`,
      obligationId: ob.id,
      phase: 'BUILD',
      route,
      moduleIds: moduleForRoute(route),
      referenceRefIds: ob.sourceRefId ? [ob.sourceRefId] : [],
      agentGuidance: `At ${route}: enforce ${ob.id}`,
      markets,
    });
  }

  if (ob.category === 'email' || ob.id.startsWith('LEG-EMAIL')) {
    for (const surface of VIRTUAL_SURFACES) {
      add({
        touchpointId: `legal/${surface}/${ob.id}`,
        obligationId: ob.id,
        phase: 'BUILD',
        route: surface,
        moduleIds: moduleForRoute(surface),
        referenceRefIds: ob.sourceRefId ? [ob.sourceRefId] : [],
        agentGuidance: `Email surface ${surface}: ${ob.id}`,
        markets,
      });
    }
  }
}

for (const step of em1.nodes) {
  for (const leg of step.legalEffects ?? []) {
    add({
      touchpointId: `legal/${step.nodeId}/${leg}`,
      obligationId: leg,
      phase: step.phase,
      route: step.route,
      moduleIds: step.moduleIds ?? [],
      flowStepId: step.nodeId,
      referenceRefIds: step.referenceRefIds ?? [],
      agentGuidance: step.agentGuidance ?? `EM-1 step ${step.phase} for ${leg}`,
    });
  }
  if (step.phase === 'COMPLIANCE' || step.phase === 'COMPLIANCE_AUDIT' || step.phase === 'UX_COMPLIANCE') {
    add({
      touchpointId: `legal/phase/${step.nodeId}`,
      obligationId: null,
      phase: step.phase,
      route: step.route,
      moduleIds: step.moduleIds ?? [],
      flowStepId: step.nodeId,
      referenceRefIds: step.referenceRefIds ?? ['ironcannon/verify-mandate'],
      agentGuidance: step.agentGuidance,
      legalEffects: step.legalEffects ?? [],
    });
  }
}

for (const ec of edge.edgeCases) {
  for (const oid of ec.obligationIds ?? []) {
    add({
      touchpointId: `legal/edge/${ec.id}/${oid}`,
      obligationId: oid,
      phase: 'SECURITY',
      edgeCaseId: ec.id,
      flowId: ec.flowId,
      agentGuidance: ec.mitigation,
      referenceRefIds: ec.protocolIds ?? [],
    });
  }
}

for (const t of tier.tools.filter((x) => x.composeRedaction)) {
  add({
    touchpointId: `legal/tier-gate/${t.id}`,
    obligationId: null,
    phase: 'COMPOSE',
    toolId: t.id,
    tierMin: t.tierMin,
    agentGuidance: `${t.id} composeRedaction enforced server-side`,
    referenceRefIds: ['ironcannon/tier-compose-redaction'],
  });
}

const out = {
  rulesetVersion: em1.rulesetVersion ?? '2026.06.03',
  touchpointCount: touchpoints.length,
  target: 1500,
  em1StepLinked: em1.nodes.filter((n) => (n.legalEffects?.length ?? 0) > 0).length,
  marketCount: MARKETS.length,
  touchpoints,
};

writeFileSync(
  join(ROOT, 'docs/engine/planning/em3-legal-touchpoints.json'),
  JSON.stringify(out, null, 2) + '\n',
);
console.log(`✓ EM-3 legal touchpoints — ${out.touchpointCount} (target ${out.target})`);
