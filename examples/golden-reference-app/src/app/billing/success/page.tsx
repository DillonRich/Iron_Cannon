'use client';

import { useRouter } from 'next/navigation';

/** M14-billing-success-ui */
export default function BillingSuccessPage() {
  const router = useRouter();
  router.refresh();
  return (
    <main>
      <h1>Billing success</h1>
      <p>Your subscription is being provisioned.</p>
    </main>
  );
}
