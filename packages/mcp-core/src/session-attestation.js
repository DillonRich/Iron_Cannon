/**
 * Wiremap attestation cache — memory + optional KV (multi-instance Workers).
 */
const sessions = new Map();
const TTL_MS = 24 * 60 * 60 * 1000;
const KV_PREFIX = 'ic:att:';

export function storeWiremapAttestation(clientKey, attestation) {
  if (!clientKey || !attestation?.token) return null;
  const entry = { attestation, storedAt: Date.now() };
  sessions.set(clientKey, entry);
  return entry;
}

export async function storeWiremapAttestationAsync(clientKey, attestation, opts = {}) {
  const mem = storeWiremapAttestation(clientKey, attestation);
  const kv = opts.sessionKv ?? opts.env?.SESSION_KV;
  if (kv?.put && clientKey && attestation?.token) {
    await kv.put(`${KV_PREFIX}${clientKey}`, JSON.stringify(mem), { expirationTtl: 86400 });
  }
  return mem;
}

export function getWiremapAttestation(clientKey) {
  const entry = sessions.get(clientKey);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > TTL_MS) {
    sessions.delete(clientKey);
    return null;
  }
  return entry.attestation;
}

export async function getWiremapAttestationAsync(clientKey, opts = {}) {
  const kv = opts.sessionKv ?? opts.env?.SESSION_KV;
  if (kv?.get && clientKey) {
    const raw = await kv.get(`${KV_PREFIX}${clientKey}`);
    if (raw) {
      try {
        const entry = JSON.parse(raw);
        if (Date.now() - entry.storedAt <= TTL_MS) return entry.attestation;
      } catch {
        /* fall through */
      }
    }
  }
  return getWiremapAttestation(clientKey);
}

export function resolveWiremapAttestation(ctx) {
  if (ctx.wiremapAttestation?.token) return ctx.wiremapAttestation;
  const clientKey = ctx.clientKey ?? ctx.clientId;
  if (!clientKey) return null;
  return getWiremapAttestation(clientKey);
}

export async function resolveWiremapAttestationAsync(ctx, opts = {}) {
  if (ctx.wiremapAttestation?.token) return ctx.wiremapAttestation;
  const clientKey = ctx.clientKey ?? ctx.clientId;
  if (!clientKey) return null;
  return getWiremapAttestationAsync(clientKey, opts);
}

/** Append T05-verified module to cached attestation (G-64). */
export function recordModuleVerification(clientKey, moduleId, attestation) {
  if (!clientKey || !moduleId) return null;
  const base = getWiremapAttestation(clientKey) ?? attestation;
  if (!base?.token) return null;
  const verifiedModules = [...new Set([...(base.verifiedModules ?? []), moduleId])];
  const next = { ...base, verifiedModules };
  storeWiremapAttestation(clientKey, next);
  return next;
}

export async function recordModuleVerificationAsync(clientKey, moduleId, attestation, opts = {}) {
  const next = recordModuleVerification(clientKey, moduleId, attestation);
  const kv = opts.sessionKv ?? opts.env?.SESSION_KV;
  if (kv?.put && clientKey && next?.token) {
    await kv.put(`${KV_PREFIX}${clientKey}`, JSON.stringify({ attestation: next, storedAt: Date.now() }), {
      expirationTtl: 86400,
    });
  }
  return next;
}

export function resetSessionStoreForTests() {
  sessions.clear();
}
