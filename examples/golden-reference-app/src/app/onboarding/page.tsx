/** onboarding flow */
export default function OnboardingPage() {
  return (
    <main>
      <h1>Onboarding wizard</h1>
      <form action="/api/onboarding/complete" method="post">
        <label>
          <input type="checkbox" name="acceptedTerms" /> I accept the terms
        </label>
        <button type="submit">Complete onboarding</button>
      </form>
    </main>
  );
}
