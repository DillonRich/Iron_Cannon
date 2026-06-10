import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

export const REFERENCE_APP_DIR = join(ROOT, 'examples/golden-reference-app');

/** Golden wiremap module → source file (relative to app root). */
export const MODULE_FILES = {
  'M01-auth-d1-schema': 'migrations/0001_init.sql',
  'M02-auth-worker-routes': 'worker/src/routes/auth.ts',
  'M03-auth-resend-emails': 'worker/src/lib/resend.ts',
  'M04-auth-ui-routes': 'src/app/signup/page.tsx',
  'M05-auth-session-middleware': 'src/middleware.ts',
  'M10-billing-d1-schema': 'migrations/0001_init.sql',
  'M11-stripe-checkout-route': 'worker/src/routes/billing.ts',
  'M12-stripe-webhook': 'worker/src/routes/stripe-webhook.ts',
  'M13-provisioning-kv': 'worker/src/routes/provisioning.ts',
  'M14-billing-success-ui': 'src/app/billing/success/page.tsx',
  'M15-billing-dashboard-ui': 'src/app/dashboard/page.tsx',
  'M16-billing-emails': 'worker/src/lib/billing-email.ts',
  'M40-deletion-api': 'worker/src/routes/deletion.ts',
};

export const GOLDEN_MODULE_ORDER = [
  'M01-auth-d1-schema',
  'M02-auth-worker-routes',
  'M03-auth-resend-emails',
  'M04-auth-ui-routes',
  'M05-auth-session-middleware',
  'M10-billing-d1-schema',
  'M11-stripe-checkout-route',
  'M12-stripe-webhook',
  'M13-provisioning-kv',
  'M14-billing-success-ui',
  'M15-billing-dashboard-ui',
  'M16-billing-emails',
];

export const REQUIRED_STRUCTURE = [
  'package.json',
  'wrangler.toml',
  '.env.example',
  'migrations/0001_init.sql',
  'worker/src/index.ts',
  'src/middleware.ts',
  'src/app/signup/page.tsx',
  'src/app/dashboard/page.tsx',
];
