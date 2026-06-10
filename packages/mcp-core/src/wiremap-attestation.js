import { createHash } from 'crypto';
import { getRulesetVersion } from './ruleset.js';

const GATED_TOOLS = new Set(['T04', 'T05', 'T11']);

function skipGate(ctx) {
  return (
    ctx.skipWiremapGate === true ||
    process.env.IRON_CANNON_SKIP_WIREMAP_GATE === '1' ||
    ctx.env?.SKIP_WIREMAP_GATE === '1'
  );
}

/** Issue attestation after T03 wiremap approval (agent or user confirms). */
export function issueWiremapAttestation(t03Result) {
  const wiremap = t03Result.wiremaps?.[0] ?? {};
  const moduleIds = wiremap.moduleIds ?? [];
  const chainId =
    wiremap.id ?? wiremap.flowIds?.join('+') ?? (t03Result.split ? 'split' : 'golden-core');
  const payload = JSON.stringify({
    chainId,
    moduleIds,
    rulesetVersion: getRulesetVersion(),
  });
  const token = createHash('sha256').update(payload).digest('hex').slice(0, 24);
  return {
    approved: true,
    chainId,
    moduleIds,
    approvedAt: new Date().toISOString(),
    token,
    phaseGate: 'WIREMAP_APPROVED',
  };
}

/** Enforce attestation before module directives / verify / prod audit. */
export function assertWiremapAttestation(toolId, ctx) {
  if (!GATED_TOOLS.has(toolId) || skipGate(ctx)) return null;
  const att = ctx.wiremapAttestation;
  if (!att?.approved || !att?.token) {
    return {
      ok: false,
      error: 'WIREMAP_NOT_APPROVED',
      message: 'Approve wiremap (T03) and pass wiremapAttestation on subsequent tool calls',
    };
  }
  const moduleId = ctx.moduleId;
  const tier = ctx.tier ?? 'pro';
  const armorOverlay = /^A\d+-/.test(moduleId ?? '');
  if (
    moduleId &&
    att.moduleIds?.length &&
    !att.moduleIds.includes(moduleId) &&
    !(armorOverlay && (tier === 'armor' || tier === 'ironclad'))
  ) {
    return {
      ok: false,
      error: 'WIREMAP_MODULE_MISMATCH',
      message: `${moduleId} not in approved wiremap`,
    };
  }
  return null;
}
