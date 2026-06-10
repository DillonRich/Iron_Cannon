/** M15-billing-dashboard-ui */
export default async function DashboardPage() {
  // In production: fetch from Worker /api/me and D1 subscriptions
  const sub = { status: 'active' };
  const portalUrl = '/api/billing/portal';
  return (
    <main>
      <h1>Dashboard</h1>
      <p>Subscription status: {sub.status}</p>
      <a href={portalUrl}>Manage billing (Stripe customer portal)</a>
      <p>stripe billingPortal sessions create customer status</p>
    </main>
  );
}
