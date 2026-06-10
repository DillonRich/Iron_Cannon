import Link from 'next/link';

export default function PricingPage() {
  return (
    <main>
      <h1>Pricing</h1>
      <p>Pro plan — $9/mo (Stripe test mode)</p>
      <form action="/api/billing/checkout" method="post">
        <button type="submit">Subscribe</button>
      </form>
      <Link href="/">Home</Link>
    </main>
  );
}
