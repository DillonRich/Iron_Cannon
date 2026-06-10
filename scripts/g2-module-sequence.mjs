#!/usr/bin/env node
import { composeModuleDirective } from '../packages/mcp-core/src/t04-compose.js';

const ok = await composeModuleDirective('M12-stripe-webhook', 'pro', {
  completedModules: ['M01-auth-d1-schema', 'M02-auth-worker-routes'],
});
if (ok.ok) {
  console.error('expected sequence violation');
  process.exit(1);
}
if (ok.error !== 'MODULE_SEQUENCE_VIOLATION') {
  console.error('wrong error', ok);
  process.exit(1);
}

const good = await composeModuleDirective('M03-auth-resend-emails', 'pro', {
  completedModules: ['M01-auth-d1-schema', 'M02-auth-worker-routes'],
});
if (!good.ok) {
  console.error('M03 should pass after M01 M02', good);
  process.exit(1);
}
console.log('✓ G-2 module sequence — MODULE_SEQUENCE_VIOLATION enforced');
process.exit(0);
