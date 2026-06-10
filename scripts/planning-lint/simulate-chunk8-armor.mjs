#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/phase1/fixtures/armor/surface-catalog.json'), 'utf8'),
);
const FIXTURE_DIR = join(ROOT, 'docs/engine/specimens/fixtures/armor');

const ARMOR_TOOLS = [
  'map_vulnerability_surfaces',
  'get_security_directives',
  'audit_production_readiness',
];

function tierAllows(tier, tool) {
  if (tier === 'pro' && ARMOR_TOOLS.includes(tool)) return false;
  return true;
}

function mapSurfaces(input) {
  if (!tierAllows(input.tier, 'map_vulnerability_surfaces')) {
    return { code: 'TIER_INSUFFICIENT' };
  }
  const out = [];
  for (const hint of input.surfaceHints ?? []) {
    const match = CATALOG.surfaces.find((s) => s.type === hint.type);
    if (match && !out.some((x) => x.surfaceId === match.surfaceId)) out.push(match);
  }
  return { ok: true, surfaces: out };
}

function securityDirectives(input) {
  if (!tierAllows(input.tier, 'get_security_directives')) {
    return { code: 'TIER_INSUFFICIENT' };
  }
  const surface = CATALOG.surfaces.find((s) => s.surfaceId === input.surfaceId);
  if (!surface) return { code: 'MODULE_NOT_FOUND' };
  return {
    ok: true,
    surfaceId: input.surfaceId,
    devModeRelaxed: !input.productionMode,
    directives: { fragments: surface.requiredMitigations },
  };
}

const READINESS_REQUIRED = [
  'M01-auth-d1-schema',
  'M05-auth-session-middleware',
  'M12-stripe-webhook',
  'A02-session-hardening-pass',
  'A03-webhook-hardening-pass',
];

function productionAudit(input) {
  if (!tierAllows(input.tier, 'audit_production_readiness')) {
    return { code: 'TIER_INSUFFICIENT' };
  }
  const done = new Set(input.wiremapContext?.completedModules ?? []);
  const checklist = READINESS_REQUIRED.map((id) => ({ id, met: done.has(id) }));
  const unmet = checklist.filter((c) => !c.met).length;
  const devPatternsToUpgrade = done.has('M12-stripe-webhook') && !done.has('A03-webhook-hardening-pass') ? 1 : 0;
  return {
    ok: true,
    ready: unmet === 0 && devPatternsToUpgrade === 0,
    minUnmet: unmet,
    devPatternsToUpgrade,
    checklist,
  };
}

function runSpec(spec) {
  const id = spec.fixtureId;
  if (id.startsWith('T09')) return mapSurfaces(spec.input);
  if (id.startsWith('T10')) return securityDirectives(spec.input);
  if (id.startsWith('T11')) return productionAudit(spec.input);
  return mapSurfaces(spec.input);
}

function assertSpec(spec, r) {
  const e = spec.expected;
  const errs = [];
  if (e.code && r.code !== e.code) errs.push(`code ${r.code}`);
  if (e.ok !== undefined && r.ok !== e.ok) errs.push(`ok ${r.ok}`);
  if (e.surfaceCount !== undefined && (r.surfaces?.length ?? 0) !== e.surfaceCount) errs.push('surfaceCount');
  if (e.surfaceIds) {
    for (const sid of e.surfaceIds) {
      if (!r.surfaces?.some((s) => s.surfaceId === sid)) errs.push(`missing ${sid}`);
    }
  }
  if (e.minCritical && !r.surfaces?.some((s) => s.riskLevel === 'critical')) errs.push('no critical');
  if (e.devModeRelaxed !== undefined && r.devModeRelaxed !== e.devModeRelaxed) errs.push('devModeRelaxed');
  if (e.surfaceId && r.surfaceId !== e.surfaceId) errs.push('surfaceId');
  if (e.ready !== undefined && r.ready !== e.ready) errs.push(`ready ${r.ready}`);
  if (e.minUnmet !== undefined && r.minUnmet < e.minUnmet) errs.push('minUnmet');
  if (e.devPatternsToUpgrade !== undefined && r.devPatternsToUpgrade !== e.devPatternsToUpgrade) {
    errs.push('devPatternsToUpgrade');
  }
  return errs;
}

const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.fixture-spec.json'));
const failures = [];

for (const file of files) {
  const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
  const r = runSpec(spec);
  const errs = assertSpec(spec, r);
  if (errs.length) failures.push(`${spec.fixtureId}: ${errs.join('; ')}`);
  else console.log(`✓ ${spec.fixtureId}`);
}

const t10 = files.filter((f) => f.includes('t10-'));
const t11 = files.filter((f) => f.includes('t11-'));
if (t10.length < 2) failures.push('T10: need >=2 fixtures');
if (t11.length < 2) failures.push('T11: need >=2 fixtures');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Chunk 8 Armor T09–T11 — ${files.length} fixtures OK`);
process.exit(0);
