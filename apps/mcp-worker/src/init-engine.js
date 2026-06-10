import { initEngineData } from '@ironcannon/mcp-core';

let initialized = false;

export async function ensureEngineData() {
  if (initialized) return;
  try {
    const mod = await import(
      '../../../packages/mcp-core/src/generated/engine-bundle.json',
      { with: { type: 'json' } },
    );
    const bundle = mod.default ?? mod;
    if (bundle && typeof bundle === 'object') {
      initEngineData(bundle);
      initialized = true;
    }
  } catch {
    // Local dev without bundle build — mcp-core falls back to filesystem when on Node
  }
}
