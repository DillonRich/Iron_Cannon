#!/usr/bin/env node
/**
 * Gate 1 readiness linter — golden path + Armor overlay + optional flows.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SPECIMENS = join(ROOT, 'docs/engine/specimens');
const MODULE_SPECS = join(ROOT, 'docs/engine/module-specs');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const GOLDEN_MODULES = [
  { id: 'M01-auth-d1-schema', specFile: 'M01-auth-d1-schema.md' },
  { id: 'M02-auth-worker-routes', specFile: 'M02-auth-worker-routes.md' },
  { id: 'M03-auth-resend-emails', specFile: 'M03-auth-resend-emails.md' },
  { id: 'M04-auth-ui-routes', specFile: 'M04-auth-ui-routes.md' },
  { id: 'M05-auth-session-middleware', specFile: 'M05-auth-session-middleware.md' },
  { id: 'M10-billing-d1-schema', specFile: 'M10-billing-d1-schema.md' },
  { id: 'M11-stripe-checkout-route', specFile: 'M11-stripe-checkout-route.md' },
  { id: 'M12-stripe-webhook', specFile: 'M12-stripe-webhook.md' },
  { id: 'M13-provisioning-kv', specFile: 'M13-provisioning-kv.md' },
  { id: 'M14-billing-success-ui', specFile: 'M14-billing-success-ui.md' },
  { id: 'M15-billing-dashboard-ui', specFile: 'M15-billing-dashboard-ui.md' },
  { id: 'M16-billing-emails', specFile: 'M16-billing-emails.md' },
];

const ARMOR_MODULES = [
  { id: 'A01-security-surface-map', specFile: 'A01-security-surface-map.md' },
  { id: 'A02-session-hardening-pass', specFile: 'A02-session-hardening-pass.md' },
  { id: 'A03-webhook-hardening-pass', specFile: 'A03-webhook-hardening-pass.md' },
];

const OPTIONAL_MODULES = [
  { id: 'M20-reset-token-schema', specFile: 'M20-reset-token-schema.md' },
  { id: 'M21-reset-api', specFile: 'M21-reset-api.md' },
  { id: 'M22-reset-ui', specFile: 'M22-reset-ui.md' },
  { id: 'M23-reset-email', specFile: 'M23-reset-email.md' },
  { id: 'M30-onboarding-schema', specFile: 'M30-onboarding-schema.md' },
  { id: 'M31-onboarding-api', specFile: 'M31-onboarding-api.md' },
  { id: 'M32-onboarding-ui', specFile: 'M32-onboarding-ui.md' },
  { id: 'M40-deletion-api', specFile: 'M40-deletion-api.md' },
  { id: 'M41-deletion-scheduler', specFile: 'M41-deletion-scheduler.md' },
  { id: 'M42-deletion-ui', specFile: 'M42-deletion-ui.md' },
];

const P1_MODULES = [
  { id: 'M50-export-api', specFile: 'M50-export-api.md' },
  { id: 'M51-export-worker', specFile: 'M51-export-worker.md' },
  { id: 'M52-export-ui', specFile: 'M52-export-ui.md' },
  { id: 'M55-terms-reaccept-api', specFile: 'M55-terms-reaccept-api.md' },
  { id: 'M56-terms-reaccept-ui', specFile: 'M56-terms-reaccept-ui.md' },
];

const errors = [];
const warnings = [];

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function collectSpecimens() {
  const files = [];
  for (const name of readdirSync(SPECIMENS)) {
    if (name.endsWith('.specimen.json') && !name.startsWith('obligation')) {
      files.push(join(SPECIMENS, name));
    }
  }
  for (const name of readdirSync(join(SPECIMENS, 'layer4'))) {
    if (name.endsWith('.specimen.json')) files.push(join(SPECIMENS, 'layer4', name));
  }
  return files.map((p) => ({ path: p, data: loadJson(p) }));
}

function collectRefIds() {
  const refIds = new Set();
  for (const file of readdirSync(REF_DIR)) {
    if (file.endsWith('.specimen.json')) refIds.add(loadJson(join(REF_DIR, file)).refId);
  }
  return refIds;
}

function validateModuleGroup(label, modules, moduleRules, refIds, { failOnMissing = true } = {}) {
  let specDocs = 0;
  const groupErrors = [];

  for (const mod of modules) {
    const specPath = join(MODULE_SPECS, mod.specFile);
    if (!existsSync(specPath)) {
      groupErrors.push(`Missing module spec doc: ${mod.specFile}`);
    } else {
      specDocs++;
      const content = readFileSync(specPath, 'utf8');
      if (!/```(?:typescript|tsx|sql|toml)/.test(content)) {
        warnings.push(`${mod.specFile}: no embedded code block detected`);
      }
    }
    if (!moduleRules.has(mod.id)) {
      groupErrors.push(`Missing rule specimen with moduleId: ${mod.id}`);
    }
  }

  if (failOnMissing) {
    groupErrors.forEach((e) => errors.push(`[${label}] ${e}`));
  } else {
    groupErrors.forEach((e) => warnings.push(`[${label}] ${e}`));
  }

  return { specDocs, total: modules.length, errors: groupErrors.length };
}

function main() {
  const specimens = collectSpecimens();
  const refIds = collectRefIds();
  const moduleRules = new Map();

  for (const { path, data } of specimens) {
    if (data.layer === 4) continue;
    const mid = data.moduleId;
    if (!mid) continue;

    const required = data.compliancePatterns?.required?.length ?? 0;
    if (required < 2) errors.push(`${path}: ${mid} has ${required} required patterns (min 2)`);

    for (const ref of data.references ?? []) {
      if (!refIds.has(ref)) errors.push(`${path}: orphan reference ${ref}`);
    }
    moduleRules.set(mid, path);
  }

  console.log('Iron Cannon Gate 1 readiness lint\n');

  const golden = validateModuleGroup('golden', GOLDEN_MODULES, moduleRules, refIds);
  console.log(`Golden path specs: ${golden.specDocs} / ${golden.total}`);
  console.log(`Module rule specimens (with moduleId): ${moduleRules.size}`);

  const armor = validateModuleGroup('armor', ARMOR_MODULES, moduleRules, refIds);
  console.log(`Armor overlay specs: ${armor.specDocs} / ${armor.total}`);

  const optional = validateModuleGroup('optional', OPTIONAL_MODULES, moduleRules, refIds);
  console.log(`Optional flow specs: ${optional.specDocs} / ${optional.total}`);

  const p1 = validateModuleGroup('p1', P1_MODULES, moduleRules, refIds);
  console.log(`P1 flow module specs: ${p1.specDocs} / ${p1.total}`);
  console.log('');

  if (warnings.length) {
    console.log('WARNINGS:');
    warnings.forEach((w) => console.log(`  ⚠ ${w}`));
    console.log('');
  }

  if (errors.length) {
    console.log('ERRORS:');
    errors.forEach((e) => console.log(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log('✓ Golden path + Armor + optional + P1 module planning complete');
  process.exit(0);
}

main();
