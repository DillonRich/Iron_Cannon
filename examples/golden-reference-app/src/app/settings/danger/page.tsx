/** M42-deletion-ui pattern (settings danger zone) */
export default function DangerSettingsPage() {
  return (
    <main>
      <h1>Danger zone</h1>
      <form action="/api/account/delete" method="post" data-state="confirm-email">
        <p>Account deletion includes a grace_period before purge.</p>
        <label htmlFor="confirmEmail">Confirm email</label>
        <input id="confirmEmail" name="confirmEmail" type="email" />
        <button type="submit">delete-account</button>
      </form>
    </main>
  );
}
