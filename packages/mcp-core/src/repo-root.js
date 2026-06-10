import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

function moduleDirFromMeta() {
  try {
    const url = import.meta?.url;
    if (url) return dirname(fileURLToPath(url));
  } catch {
    /* Workers bundle may omit import.meta.url */
  }
  return null;
}

/** Monorepo root (packages/mcp-core/src → ../../../); empty in Worker until bundle-only paths */
export const REPO_ROOT = (() => {
  const dir = moduleDirFromMeta();
  if (dir) return join(dir, '../../..');
  return process.env.IRON_CANNON_REPO_ROOT ?? '';
})();

export function planningPath(...segments) {
  return join(REPO_ROOT, 'docs/engine', ...segments);
}
