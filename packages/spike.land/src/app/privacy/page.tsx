"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LAST_UPDATED = "February 19, 2026";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "data-collection", title: "Data Collection" },
  { id: "data-storage", title: "Data Storage & Retention" },
  { id: "user-rights", title: "Your Privacy Rights" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "security", title: "Security Measures" },
  { id: "children", title: "Children's Privacy" },
  { id: "contact", title: "Contact Us" },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto pt-24 pb-12 px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="text-muted-foreground mt-4">
            This is a template for informational purposes. Consult with a qualified attorney for
            legal advice specific to your situation.
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Table of Contents</CardTitle>
            <CardDescription>
              Quick navigation to our privacy policy sections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map(section => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-primary hover:underline"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8 max-w-4xl">
          {/* Introduction */}
          <section id="introduction">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Introduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Welcome to Pixel (Spike Land). We are committed to protecting your privacy and
                  ensuring you have a positive experience on our platform. This Privacy Policy
                  explains:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>What information we collect</li>
                  <li>How we use your information</li>
                  <li>Your rights and choices</li>
                  <li>How we protect your data</li>
                  <li>How to contact us</li>
                </ul>
                <p className="pt-4">
                  <strong>Operator:</strong> SPIKE LAND LTD (Company Number 16906682)
                </p>
                <p>
                  <strong>Registered Office:</strong> United Kingdom
                </p>
                <p>
                  <strong>Contact:</strong> hello@spike.land
                </p>
                <p>
                  <strong>Jurisdiction:</strong>{" "}
                  This policy complies with GDPR (EU), UK GDPR, and CCPA (California) requirements.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Data Collection */}
          <section id="data-collection">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Data Collection</CardTitle>
                <CardDescription>
                  What information we collect and why
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Information You Provide
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Account Information</h4>
                      <p className="text-muted-foreground">
                        Email, name, and profile image (from OAuth providers like Google or GitHub)
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Images</h4>
                      <p className="text-muted-foreground">
                        Original and enhanced images uploaded for processing
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Payment Information</h4>
                      <p className="text-muted-foreground">
                        Token transactions are processed via Stripe (we do not store credit card
                        data)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Information Collected Automatically
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Usage Analytics</h4>
                      <p className="text-muted-foreground">
                        Features used, enhancement tiers selected, interaction patterns
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Technical Data</h4>
                      <p className="text-muted-foreground">
                        IP address, browser type, operating system, referring URLs
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Session Data</h4>
                      <p className="text-muted-foreground">
                        JWT authentication tokens for secure session management
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    What We Don&apos;t Collect
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
                    <li>Images are NOT used for AI model training</li>
                    <li>No biometric or facial recognition data extracted</li>
                    <li>
                      No EXIF metadata retained from images (automatically stripped on upload)
                    </li>
                    <li>No precise geolocation data</li>
                    <li>
                      No credit card data (Stripe handles all payment processing)
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data Storage & Retention */}
          <section id="data-storage">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Data Storage & Retention
                </CardTitle>
                <CardDescription>
                  Where we store your data and how long we keep it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Storage Locations
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-2">Data Type</th>
                          <th className="text-left py-2">Storage</th>
                          <th className="text-left py-2">Encryption</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b border-border">
                          <td className="py-2">User accounts</td>
                          <td>PostgreSQL (Neon)</td>
                          <td>At-rest AES-256</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">Images</td>
                          <td>Cloudflare R2</td>
                          <td>At-rest AES-256</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">Session tokens</td>
                          <td>JWT (signed)</td>
                          <td>Signed & encrypted</td>
                        </tr>
                        <tr>
                          <td className="py-2">Payment data</td>
                          <td>Stripe (PCI DSS Level 1)</td>
                          <td>Stripe managed</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Retention Periods
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-2">Data Type</th>
                          <th className="text-left py-2">Retention Period</th>
                          <th className="text-left py-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b border-border">
                          <td className="py-2">User account</td>
                          <td>Until deletion</td>
                          <td>Service continuity</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">Images (inactive)</td>
                          <td>90 days</td>
                          <td>Re-enhancement availability</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">Transactions</td>
                          <td>7 years</td>
                          <td>Legal & tax requirements</td>
                        </tr>
                        <tr>
                          <td className="py-2">Server logs</td>
                          <td>30 days</td>
                          <td>Security monitoring</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Automatic Image Cleanup
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-muted-foreground text-sm">
                      Images inactive for 90 days are automatically deleted:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 mt-2 text-muted-foreground text-sm">
                      <li>Warning email sent (7 days before deletion)</li>
                      <li>Image moved to deletion queue</li>
                      <li>Permanently deleted from storage</li>
                      <li>Database records removed</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Account Deletion
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Immediate (within 24 hours)
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                        <li>Session tokens invalidated</li>
                        <li>OAuth connections revoked</li>
                        <li>Login disabled</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Within 30 days
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                        <li>All images deleted from storage</li>
                        <li>User record anonymized</li>
                        <li>Albums removed</li>
                        <li>
                          Transaction records retained (legal requirement)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* User Rights */}
          <section id="user-rights">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Your Privacy Rights</CardTitle>
                <CardDescription>
                  Rights granted under GDPR, UK GDPR, and CCPA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Your Rights</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">
                        Right of Access (GDPR Art. 15)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        You can request a copy of all personal data we hold about you.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">
                        Right to Rectification (GDPR Art. 16)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        You can request correction of inaccurate personal data.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">
                        Right to Erasure (GDPR Art. 17)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        You can request deletion of your personal data (subject to legal
                        obligations).
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">
                        Right to Restrict Processing (GDPR Art. 18)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        You can request that we limit how we use your data.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">
                        Right to Data Portability (GDPR Art. 20)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        You can request your data in a portable format for transfer to another
                        service.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">
                        Right to Object (GDPR Art. 21)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        You can object to processing of your data based on legitimate interests.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    How to Exercise Your Rights
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-muted-foreground text-sm">
                      To exercise any of these rights, contact us at{" "}
                      <a
                        href="mailto:hello@spike.land"
                        className="text-primary hover:underline"
                      >
                        hello@spike.land
                      </a>
                      . We will respond to your request within 30 days.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    California Privacy Rights (CCPA)
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      California residents have the right to know what personal information is
                      collected, the right to delete, and the right to opt-out of the selling of
                      their personal data. We do not sell personal data. For requests, contact
                      hello@spike.land.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Response Times</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-2">Request Type</th>
                          <th className="text-left py-2">
                            Maximum Response Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b border-border">
                          <td className="py-2">Data access</td>
                          <td>30 days</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">Correction</td>
                          <td>72 hours</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">Deletion</td>
                          <td>30 days</td>
                        </tr>
                        <tr>
                          <td className="py-2">Data portability</td>
                          <td>30 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Third-Party Services */}
          <section id="third-party">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Third-Party Services</CardTitle>
                <CardDescription>
                  Services we use to operate the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Google Gemini API
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <p>
                      <strong>Purpose:</strong> AI image enhancement processing
                    </p>
                    <p>
                      <strong>Data sent:</strong> Image bytes only (not metadata)
                    </p>
                    <p>
                      <strong>Location:</strong> US (Google Cloud)
                    </p>
                    <p>
                      <strong>Data retention:</strong> Per Google AI Principles
                    </p>
                    <p className="text-muted-foreground">
                      When you use image enhancement, your image is processed by Google&apos;s AI.
                      By using this feature, you consent to this processing.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Stripe (Payment Processing)
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <p>
                      <strong>Purpose:</strong> Secure payment processing
                    </p>
                    <p>
                      <strong>Data sent:</strong> Email and payment method
                    </p>
                    <p>
                      <strong>Compliance:</strong> PCI DSS Level 1 certified
                    </p>
                    <p>
                      <strong>Credit cards:</strong>{" "}
                      Not stored by us (Stripe manages all payment data)
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Cloudflare R2</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <p>
                      <strong>Purpose:</strong> Secure image storage
                    </p>
                    <p>
                      <strong>Location:</strong> Edge network (nearest region)
                    </p>
                    <p>
                      <strong>Encryption:</strong> AES-256 at rest
                    </p>
                    <p>
                      <strong>Access:</strong> Signed URLs only (temporary access)
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Neon PostgreSQL
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <p>
                      <strong>Purpose:</strong> User account and transaction database
                    </p>
                    <p>
                      <strong>Encryption:</strong> At-rest encryption enabled
                    </p>
                    <p>
                      <strong>Backup:</strong> Automated daily backups
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Vercel</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <p>
                      <strong>Purpose:</strong> Application hosting and deployment
                    </p>
                    <p>
                      <strong>Features:</strong> Analytics, performance monitoring
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Data Processing Agreements
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    We have Data Processing Agreements (DPAs) in place with all sub-processors. For
                    cross-border transfers outside the EEA, we use Standard Contractual Clauses
                    (SCCs) or the EU-US Data Privacy Framework.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Security */}
          <section id="security">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Security Measures</CardTitle>
                <CardDescription>How we protect your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Technical Security
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">TLS 1.3:</span>
                      <span className="text-muted-foreground">
                        All data in transit encrypted
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">AES-256:</span>
                      <span className="text-muted-foreground">
                        All data at rest encrypted
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">OAuth 2.0:</span>
                      <span className="text-muted-foreground">
                        Secure authentication with providers
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">JWT Tokens:</span>
                      <span className="text-muted-foreground">
                        Signed and encrypted session tokens
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Rate Limiting:</span>
                      <span className="text-muted-foreground">
                        Protection against brute force and DoS attacks
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">
                        File Validation:
                      </span>
                      <span className="text-muted-foreground">
                        Type checking and size limits on uploads
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Organizational Security
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Access control and role-based permissions</li>
                    <li>Audit logging of all administrative actions</li>
                    <li>72-hour data breach notification requirement</li>
                    <li>Annual security training and updates</li>
                    <li>
                      Regular security assessments and penetration testing
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Rate Limiting Policy
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-2">Action</th>
                          <th className="text-left py-2">Limit</th>
                          <th className="text-left py-2">Window</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b border-border">
                          <td className="py-2">Login attempts</td>
                          <td>5 attempts</td>
                          <td>15 minutes</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">Image uploads</td>
                          <td>20 per user</td>
                          <td>1 hour</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">API requests</td>
                          <td>100 per user</td>
                          <td>1 minute</td>
                        </tr>
                        <tr>
                          <td className="py-2">Password reset</td>
                          <td>3 attempts</td>
                          <td>1 hour</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Children's Privacy */}
          <section id="children">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Children&apos;s Privacy
                </CardTitle>
                <CardDescription>COPPA Compliance (US)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Pixel (Spike Land) is not intended for children under 13 years of age. We do not
                  knowingly collect personal information from children under 13.
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold">
                    If you believe a child under 13 has created an account:
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Please contact us at{" "}
                    <a
                      href="mailto:hello@spike.land"
                      className="text-primary hover:underline"
                    >
                      hello@spike.land
                    </a>{" "}
                    and we will delete the account within 30 days.
                  </p>
                </div>
                <p className="text-muted-foreground text-sm">
                  By using this service, you confirm that you are at least 13 years old or have
                  parental consent.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section id="contact">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Contact Us</CardTitle>
                <CardDescription>How to reach our privacy team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Privacy Inquiries
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p>
                      Email:{" "}
                      <a
                        href="mailto:hello@spike.land"
                        className="text-primary hover:underline"
                      >
                        hello@spike.land
                      </a>
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Response time: 72 hours
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Data Protection Officer
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    We maintain records of our data processing activities per GDPR Article 30.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Regulatory Authorities
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    If you believe your privacy rights have been violated, you can lodge a complaint
                    with:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">UK:</span>
                      <span className="text-muted-foreground">
                        <a
                          href="https://ico.org.uk"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Information Commissioner&apos;s Office (ICO)
                        </a>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">EU:</span>
                      <span className="text-muted-foreground">
                        Your local Data Protection Authority
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">US:</span>
                      <span className="text-muted-foreground">
                        <a
                          href="https://www.ftc.gov"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Federal Trade Commission (FTC)
                        </a>
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Policy Updates</h3>
                  <p className="text-muted-foreground text-sm">
                    We may update this privacy policy to reflect changes in our practices or
                    applicable law. We will notify you of material changes via email or by posting
                    the updated policy here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Disclaimer */}
          <Card className="bg-yellow-900/50 border-yellow-700">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-100">
                Legal Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-200">
                This Privacy Policy is a template for informational purposes only. It provides
                general guidance on privacy compliance with GDPR, UK GDPR, and CCPA regulations.
                However, privacy laws are complex and evolve frequently. You should consult with a
                qualified attorney who specializes in privacy and data protection law to ensure this
                policy is fully compliant with all applicable laws in your jurisdiction and to
                customize it for your specific business model and operations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
