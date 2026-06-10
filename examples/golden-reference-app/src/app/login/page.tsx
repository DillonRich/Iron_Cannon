import Link from 'next/link';

/** M04-auth-ui-routes */
export default function LoginPage() {
  return (
    <main>
      <h1>Log in</h1>
      <form>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        <button type="submit">Send magic link</button>
      </form>
      <p>
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
    </main>
  );
}
