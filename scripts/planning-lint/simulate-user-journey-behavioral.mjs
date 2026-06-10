#!/usr/bin/env node
/**
 * User-journey behavioral harness — real invokeTool chains per persona story.
 * Usage: npm run planning:user-journey
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { invokeTool } from './lib/mcp-invoke.mjs';
import { loadModuleFixture } from '../../packages/mcp-core/src/load-fixture.js';
import { REFERENCE_APP_DIR } from './lib/golden-reference-app-modules.mjs';
import { resetThrottleGuardForTests } from '../../packages/mcp-core/src/throttle-guard.js';
import { resetRateLimitForTests } from '../../packages/mcp-core/src/rate-limit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);

function getPath(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function resolveInput(input, ctx) {
  if (!input || typeof input !== 'object') return input;
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'string' && v.startsWith('$')) {
      const key = v.slice(1);
      out[k] = ctx[key];
    } else {
      out[k] = v;
    }
  }
  return out;
}

function checkExpect(result, expect, extra = []) {
  const checks = [];
  if (expect.ok !== undefined) {
    const actualOk = result.ok !== false && !result.error;
    checks.push({ name: 'ok', pass: actualOk === expect.ok });
  }
  if (expect.error !== undefined) {
    checks.push({ name: 'error', pass: result.error === expect.error });
  }
  if (expect.path !== undefined) {
    const val = getPath(result, expect.path);
    if (expect.eq !== undefined) checks.push({ name: expect.path, pass: val === expect.eq });
    if (expect.gte !== undefined) checks.push({ name: `${expect.path}>=${expect.gte}`, pass: (val ?? 0) >= expect.gte });
    if (expect.includes !== undefined) {
      checks.push({ name: `${expect.path} includes`, pass: String(val ?? '').includes(expect.includes) });
    }
    if (expect.exists) checks.push({ name: `${expect.path} exists`, pass: val !== undefined && val !== null });
  }
  for (const c of extra) {
    const val = getPath(result, c.path);
    if (c.exists) checks.push({ name: c.path, pass: val !== undefined && val !== null });
    if (c.eq !== undefined) checks.push({ name: c.path, pass: val === c.eq });
  }
  return checks;
}

async function runSetup(setup, ctx, tier) {
  if (setup?.throttleReset) resetThrottleGuardForTests();
  if (setup?.rateLimitReset) resetRateLimitForTests();
  if (setup?.chain === 'golden_att' || setup?.chain === 'golden_att_full') {
    const t01 = await invokeTool('T01', { fixtureId: 'SD-01', tier });
    const t03 = await invokeTool('T03', { tier });
    ctx.stack = t01.stack;
    ctx.wiremapAttestation = t03.wiremapAttestation;
    ctx.moduleIds = t03.wiremaps?.[0]?.moduleIds ?? [];
  }
  if (setup?.chain === 'sd06_att') {
    const t01 = await invokeTool('T01', { fixtureId: 'SD-06', tier });
    const t03 = await invokeTool('T03', { stackId: 'SD-06', tier });
    ctx.stack = t01.stack;
    ctx.wiremapAttestation = t03.wiremapAttestation;
    ctx.moduleIds = t03.wiremaps?.[0]?.moduleIds ?? [];
  }
  if (setup?.chain === 'sd07_att') {
    const t01 = await invokeTool('T01', { fixtureId: 'SD-07', tier });
    const t03 = await invokeTool('T03', { stackId: 'SD-07', tier });
    ctx.stack = t01.stack;
    ctx.wiremapAttestation = t03.wiremapAttestation;
    ctx.moduleIds = t03.wiremaps?.[0]?.moduleIds ?? [];
  }
  if (setup?.chain === 'ref_app_att') {
    const t01 = await invokeTool('T01', { projectPath: REFERENCE_APP_DIR, tier });
    const t03 = await invokeTool('T03', { tier });
    ctx.stack = t01.stack;
    ctx.wiremapAttestation = t03.wiremapAttestation;
    ctx.moduleIds = t03.wiremaps?.[0]?.moduleIds ?? [];
  }
}

async function runRateLimitLoop(s, clientKey) {
  const { tool, maxCalls, expectError } = s.rateLimit;
  let blocked = null;
  for (let i = 0; i < maxCalls; i += 1) {
    const result = await invokeTool(tool, { tier: s.tier, clientKey });
    if (!result.ok && result.error === expectError) {
      blocked = result;
      break;
    }
  }
  return blocked ? [] : [`rate_limit_loop: expected ${expectError} within ${maxCalls} calls`];
}

async function runThrottleLoop(s, ctx, clientKey) {
  const { tool, moduleId, maxCalls, expectError } = s.throttle;
  const att = ctx.wiremapAttestation ?? { approved: true, token: 'uj-throttle', moduleIds: [moduleId] };
  let blocked = null;
  for (let i = 0; i < maxCalls; i += 1) {
    const result = await invokeTool(tool, {
      moduleId,
      tier: s.tier,
      clientKey,
      wiremapAttestation: att,
    });
    if (!result.ok && result.error === expectError) {
      blocked = result;
      break;
    }
  }
  return blocked ? [] : [`throttle_loop: expected ${expectError} within ${maxCalls} calls`];
}

async function runScenario(s) {
  const ctx = { tier: s.tier ?? 'pro' };
  const clientKey = `uj-${s.id}`;
  resetRateLimitForTests();
  resetThrottleGuardForTests();

  const savedEnv = { IRON_CANNON_SKIP_WIREMAP_GATE: process.env.IRON_CANNON_SKIP_WIREMAP_GATE };
  delete process.env.IRON_CANNON_SKIP_WIREMAP_GATE;
  const env = { ...(s.env ?? {}), ...(s.setup?.env ?? {}) };
  for (const [k, v] of Object.entries(env)) {
    savedEnv[k] = process.env[k];
    process.env[k] = v;
  }

  if (s.setup) await runSetup(s.setup, ctx, s.tier);

  if (s.type === 'throttle_loop') {
    const f = await runThrottleLoop(s, ctx, clientKey);
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    return f;
  }

  if (s.type === 'rate_limit_loop') {
    const f = await runRateLimitLoop(s, clientKey);
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    return f;
  }

  const stepFailures = [];
  let stepIndex = 0;
  for (const step of s.steps) {
    stepIndex += 1;
    const input = resolveInput(step.input ?? {}, ctx);
    if (
      step.tool === 'T05' &&
      input.moduleId &&
      !String(input.snippet ?? input.codeSnippet ?? '').trim() &&
      step.expect?.path === 'compliant' &&
      step.expect?.eq === true
    ) {
      const spec = loadModuleFixture(input.moduleId);
      if (spec?.passSnippet) input.snippet = spec.passSnippet;
    }
    const merged = { tier: s.tier, clientKey, ...input };
    const result = await invokeTool(step.tool, merged);

    if (step.capture) {
      for (const cap of step.capture) {
        ctx[cap] = result[cap] ?? getPath(result, cap);
      }
    }
    if (step.tool === 'T01' && result.stack) ctx.stack = result.stack;
    if (step.tool === 'T03' && result.wiremapAttestation) ctx.wiremapAttestation = result.wiremapAttestation;

    const checks = checkExpect(result, step.expect ?? {}, step.extraChecks ?? []);
    const failed = checks.filter((c) => !c.pass);
    if (failed.length) {
      stepFailures.push(
        `step ${stepIndex} ${step.tool}: ${failed.map((f) => f.name).join(', ')} (error=${result.error ?? 'none'})`,
      );
    }
  }

  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }

  return stepFailures;
}

const failures = [];
let totalSteps = 0;
for (const s of REG.scenarios) {
  totalSteps += s.type === 'throttle_loop' || s.type === 'rate_limit_loop' ? (s.throttle?.maxCalls ?? s.rateLimit?.maxCalls ?? 1) : s.steps.length;
  const f = await runScenario(s);
  if (f.length) failures.push(`${s.id} ${s.persona}: ${f.join('; ')}`);
  else console.log(`✓ ${s.id} ${s.story.slice(0, 72)}${s.story.length > 72 ? '…' : ''}`);
}

const passRate = (REG.scenarios.length - failures.length) / REG.scenarios.length;
if (failures.length || passRate < REG.minPassRate) {
  console.error(
    `User-journey behavioral failures (${failures.length}/${REG.scenarios.length}, ${totalSteps} steps):\n` +
      failures.join('\n'),
  );
  process.exit(1);
}

console.log(
  `✓ User-journey behavioral — ${REG.scenarios.length}/${REG.scenarios.length} journeys, ${totalSteps} invokeTool steps (100%)`,
);
process.exit(0);
