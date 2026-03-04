export function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: March 2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
        <p className="leading-relaxed text-foreground">
          By accessing or using spike.land, you agree to be bound by these Terms of Service. If you
          do not agree, do not use the platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Use of the Platform</h2>
        <ul className="list-inside list-disc space-y-2 text-foreground">
          <li>You must be at least 13 years old to use spike.land</li>
          <li>You are responsible for maintaining the security of your account</li>
          <li>You agree not to misuse the platform or interfere with its operation</li>
          <li>Automated access is permitted only through published APIs and MCP tools</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Content and Applications</h2>
        <p className="leading-relaxed text-foreground">
          You retain ownership of applications and content you create on spike.land. By publishing
          an application to the store, you grant spike.land a non-exclusive license to display and
          distribute it within the platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Limitation of Liability</h2>
        <p className="leading-relaxed text-foreground">
          spike.land is provided &ldquo;as is&rdquo; without warranties of any kind. We are not
          liable for any damages arising from your use of the platform, including data loss or
          service interruptions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Changes to Terms</h2>
        <p className="leading-relaxed text-foreground">
          We may update these terms from time to time. Continued use of the platform after changes
          constitutes acceptance of the new terms.
        </p>
      </section>
    </div>
  );
}
