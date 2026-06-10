#!/usr/bin/env node
import { lookupDevRegistry } from '../packages/mcp-core/src/api-key-store.js';

const revoked = lookupDevRegistry('ic_dev_pro_revokedtest1234', {
  env: {
    API_KEYS_JSON: JSON.stringify({
      keys: [
        {
          token: 'ic_dev_pro_revokedtest1234',
          tier: 'pro',
          revoked: true,
        },
      ],
    }),
  },
});

if (!revoked || revoked.ok || revoked.error !== 'SUBSCRIPTION_INACTIVE') {
  console.error('expected SUBSCRIPTION_INACTIVE for revoked', revoked);
  process.exit(1);
}

const pastDue = lookupDevRegistry('ic_dev_armor_pastdue12345678', {
  env: {
    API_KEYS_JSON: JSON.stringify({
      keys: [
        {
          token: 'ic_dev_armor_pastdue12345678',
          tier: 'armor',
          subscriptionStatus: 'past_due',
        },
      ],
    }),
  },
});

if (!pastDue || pastDue.ok || pastDue.error !== 'SUBSCRIPTION_INACTIVE') {
  console.error('expected SUBSCRIPTION_INACTIVE for past_due', pastDue);
  process.exit(1);
}

console.log('✓ g2-subscription-inactive — revoked + past_due keys blocked');
process.exit(0);
