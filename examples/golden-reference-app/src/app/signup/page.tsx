import Link from 'next/link';

/** M04-auth-ui-routes */
export default function SignupPage() {
  return (
    <main>
      <h1>Sign up</h1>
      <form action="/api/auth/signup" method="post">
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        <button type="submit">Continue</button>
      </form>
    </main>
  );
}
