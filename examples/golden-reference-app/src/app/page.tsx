import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Iron Cannon Demo SaaS</h1>
      <p>Golden reference app — SD-01 stack</p>
      <nav>
        <Link href="/pricing">Pricing</Link> · <Link href="/login">Login</Link> ·{' '}
        <Link href="/signup">Sign up</Link>
      </nav>
    </main>
  );
}
