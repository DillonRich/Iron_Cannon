import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

/** Iron Cannon monorepo root — dogfood T01 projectPath target (G-39). */
export const REPO_ROOT = ROOT;

export const MCP_WORKER_DIR = join(ROOT, 'apps/mcp-worker');
export const MCP_CORE_DIR = join(ROOT, 'packages/mcp-core');

/** Subpaths exercised in dogfood live harness (G-39). */
export const DOGFOOD_PATHS = {
  repoRoot: REPO_ROOT,
  mcpWorker: MCP_WORKER_DIR,
  mcpCore: MCP_CORE_DIR,
};
