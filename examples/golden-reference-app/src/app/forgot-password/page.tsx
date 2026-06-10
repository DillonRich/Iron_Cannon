/** password-reset flow UI */
export default function ForgotPasswordPage() {
  return (
    <main>
      <h1>Forgot password</h1>
      <form action="/api/auth/forgot-password" method="post">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" />
        <button type="submit">Send reset link</button>
      </form>
    </main>
  );
}
