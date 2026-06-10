#!/usr/bin/env node
/**
 * Local MCP Worker — builds bundle then runs wrangler dev.
 */
import { spawnSync, spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKER = join(ROOT, 'apps/mcp-worker');

console.log('Building worker rules bundle…');
const build = spawnSync('npm', ['run', 'build:worker-bundle'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
});
if (build.status !== 0) process.exit(build.status ?? 1);

console.log('\nStarting wrangler dev (http://127.0.0.1:8787)…');
console.log('  POST http://127.0.0.1:8787/mcp');
console.log('  GET  http://127.0.0.1:8787/health\n');

const child = spawn('npx', ['wrangler', 'dev', '--port', '8787'], {
  cwd: WORKER,
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
