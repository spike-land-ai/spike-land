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
  { id: "introduction", title: "What Are Cookies" },
  { id: "cookies-used", title: "Cookies We Use" },
  { id: "essential", title: "Essential Cookies" },
  { id: "analytics", title: "Analytics Cookies" },
  { id: "third-party", title: "Third-Party Cookies" },
  { id: "managing-cookies", title: "Managing Cookies" },
  { id: "consent", title: "Cookie Consent" },
  { id: "updates", title: "Policy Updates" },
  { id: "contact", title: "Contact Us" },
];

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto pt-24 pb-12 px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Table of Contents</CardTitle>
            <CardDescription>
              Quick navigation to our cookie policy sections
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
                <CardTitle className="text-2xl">What Are Cookies</CardTitle>
                <CardDescription>
                  Understanding cookies and how they work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Definition</h3>
                  <p className="text-muted-foreground">
                    Cookies are small text files that are stored on your device (computer, tablet,
                    or mobile phone) when you visit a website. They contain information that the
                    website can read when you return to it. Cookies help websites recognize you and
                    remember your preferences.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    How Cookies Work
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>You visit the Pixel (Spike Land)</li>
                    <li>
                      The website sends a small file (cookie) to your browser
                    </li>
                    <li>Your browser stores this cookie on your device</li>
                    <li>
                      When you return to the website, your browser sends the cookie back
                    </li>
                    <li>
                      The website recognizes you and can use the information in the cookie
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Types of Cookies
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Session Cookies</h4>
                      <p className="text-muted-foreground text-sm">
                        Temporary cookies that are deleted when you close your browser. Used to keep
                        you logged in during your session.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Persistent Cookies</h4>
                      <p className="text-muted-foreground text-sm">
                        Cookies that remain on your device for a set period or until you delete
                        them. Used to remember your preferences across visits.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">First-Party Cookies</h4>
                      <p className="text-muted-foreground text-sm">
                        Set by the website you are visiting (Pixel). Used for essential
                        functionality and user preferences.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Third-Party Cookies</h4>
                      <p className="text-muted-foreground text-sm">
                        Set by other websites or services embedded in our site. Used for analytics,
                        payments, and authentication.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cookies We Use */}
          <section id="cookies-used">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Cookies We Use</CardTitle>
                <CardDescription>
                  Complete list of all cookies on our platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Cookie Summary Table
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-2">Cookie Name</th>
                          <th className="text-left py-2">Purpose</th>
                          <th className="text-left py-2">Duration</th>
                          <th className="text-left py-2">Type</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b border-border">
                          <td className="py-2 font-mono text-xs">
                            authjs.session-token
                          </td>
                          <td>User authentication session</td>
                          <td>Session / 30 days</td>
                          <td>Essential</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 font-mono text-xs">
                            __Secure-authjs.session-token
                          </td>
                          <td>Secure session token (HTTPS)</td>
                          <td>Session / 30 days</td>
                          <td>Essential</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 font-mono text-xs">
                            authjs.csrf-token
                          </td>
                          <td>CSRF protection</td>
                          <td>Session</td>
                          <td>Essential</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 font-mono text-xs">
                            authjs.callback-url
                          </td>
                          <td>OAuth callback redirect</td>
                          <td>Session</td>
                          <td>Essential</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 font-mono text-xs">
                            __Vercel_Insights_Cache
                          </td>
                          <td>Vercel performance insights</td>
                          <td>1 year</td>
                          <td>Analytics</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 font-mono text-xs">stripe.js</td>
                          <td>Stripe payment processing</td>
                          <td>Session</td>
                          <td>Third-Party</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 font-mono text-xs">_ga</td>
                          <td>Google Analytics tracking</td>
                          <td>2 years</td>
                          <td>Analytics</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-xs">
                            _oauth_nonce
                          </td>
                          <td>OAuth security nonce</td>
                          <td>Session</td>
                          <td>Essential</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong>{" "}
                    Cookie names and durations may vary based on configuration and updates to
                    third-party services. This table reflects current standard implementations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Essential Cookies */}
          <section id="essential">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Essential Cookies</CardTitle>
                <CardDescription>
                  Necessary for core functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Why We Need Them
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Essential cookies are absolutely necessary for the website to function properly.
                    They cannot be disabled without breaking core features. These cookies enable:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Keeping you logged into your account</li>
                    <li>Protecting against security threats (CSRF attacks)</li>
                    <li>
                      Processing OAuth authentication with Google and GitHub
                    </li>
                    <li>Maintaining your session across page navigations</li>
                    <li>Storing temporary security nonces</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Cannot Be Disabled
                  </h3>
                  <div className="bg-yellow-900/50 border border-yellow-700 p-4 rounded-lg">
                    <p className="text-yellow-100 text-sm">
                      <strong>Important:</strong>{" "}
                      Essential cookies cannot be disabled. If you block these cookies, you will not
                      be able to log in, authenticate with Google or GitHub, or use key features of
                      the application. These cookies are not used for tracking or marketing
                      purposes.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Essential Cookies List
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm">
                        authjs.session-token / __Secure-authjs.session-token
                      </h4>
                      <p className="text-muted-foreground text-sm mt-1">
                        Stores your authentication session. Set by NextAuth.js when you log in. The
                        secure version is only sent over HTTPS connections.
                      </p>
                      <p className="text-muted-foreground text-xs mt-2">
                        Duration: Session or 30 days (depending on "Remember me" choice)
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm">
                        authjs.csrf-token
                      </h4>
                      <p className="text-muted-foreground text-sm mt-1">
                        Protects against Cross-Site Request Forgery attacks. Required for secure
                        form submissions.
                      </p>
                      <p className="text-muted-foreground text-xs mt-2">
                        Duration: Session only
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm">
                        authjs.callback-url
                      </h4>
                      <p className="text-muted-foreground text-sm mt-1">
                        Stores the URL to redirect to after OAuth authentication completes.
                      </p>
                      <p className="text-muted-foreground text-xs mt-2">
                        Duration: Session only
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm">_oauth_nonce</h4>
                      <p className="text-muted-foreground text-sm mt-1">
                        Security token used in OAuth flows to prevent replay attacks.
                      </p>
                      <p className="text-muted-foreground text-xs mt-2">
                        Duration: Session only
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Analytics Cookies */}
          <section id="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Analytics Cookies</CardTitle>
                <CardDescription>
                  Help us understand how you use our platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    What They Track
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Analytics cookies collect information about how you use the Spike Land Image
                    Enhancement App. This helps us:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Understand which features are most popular</li>
                    <li>Identify performance issues</li>
                    <li>Improve the user experience</li>
                    <li>Monitor website speed and reliability</li>
                    <li>Track anonymous usage patterns</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Analytics Services We Use
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">
                        Vercel Analytics
                      </h4>
                      <p className="text-muted-foreground text-sm mb-2">
                        <strong>Purpose:</strong>{" "}
                        Tracks page views, user interactions, and performance metrics
                      </p>
                      <p className="text-muted-foreground text-sm mb-2">
                        <strong>Data collected:</strong>{" "}
                        Page URLs, referrer, device type, browser type, approximate location
                        (country level)
                      </p>
                      <p className="text-muted-foreground text-sm">
                        <strong>Privacy:</strong>{" "}
                        Vercel Analytics does not use cookies for tracking and does not require
                        cookie consent
                      </p>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">
                        Vercel Speed Insights
                      </h4>
                      <p className="text-muted-foreground text-sm mb-2">
                        <strong>Purpose:</strong>{" "}
                        Monitors application performance and loading speeds
                      </p>
                      <p className="text-muted-foreground text-sm mb-2">
                        <strong>Data collected:</strong>{" "}
                        Page load times, Core Web Vitals, performance metrics
                      </p>
                      <p className="text-muted-foreground text-sm">
                        <strong>Privacy:</strong>{" "}
                        No personal data collected, does not require cookie consent
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Opt-Out</h3>
                  <p className="text-muted-foreground mb-4">
                    You can manage cookie preferences through several methods. Here are your options
                    for opting out of non-essential cookies:
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Browser Settings
                      </h4>
                      <p className="text-muted-foreground text-sm mb-2">
                        You can opt out of analytics tracking through your browser settings. Most
                        browsers allow you to:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-2">
                        <li>Block cookies from analytics services</li>
                        <li>Set "Do Not Track" preference</li>
                        <li>Use private/incognito browsing</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Browser Extensions
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        You can install privacy-focused browser extensions to block analytics
                        trackers (e.g., uBlock Origin, Privacy Badger, Ghostery)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Vercel Privacy Policy
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    For more information about how Vercel handles data, see their{" "}
                    <a
                      href="https://vercel.com/legal/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Third-Party Cookies */}
          <section id="third-party">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Third-Party Cookies</CardTitle>
                <CardDescription>
                  Cookies set by external services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-muted-foreground mb-6">
                    Some cookies are set by external services that are embedded in our application.
                    These services help us provide authentication, payments, and other
                    functionality.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">Google OAuth</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      <strong>Purpose:</strong> Authentication and login
                    </p>
                    <p className="text-muted-foreground text-sm">
                      When you click "Sign in with Google," Google sets cookies to manage your
                      authentication session and verify your identity.
                    </p>
                    <p className="text-sm mt-3">
                      <strong>Privacy Policy:</strong>{" "}
                      <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Privacy Policy
                      </a>
                    </p>
                    <p className="text-sm">
                      <strong>Cookies Policy:</strong>{" "}
                      <a
                        href="https://policies.google.com/technologies/cookies"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Cookies Policy
                      </a>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">GitHub OAuth</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      <strong>Purpose:</strong> Authentication and login
                    </p>
                    <p className="text-muted-foreground text-sm">
                      When you click "Sign in with GitHub," GitHub sets cookies to manage your
                      authentication session and verify your identity.
                    </p>
                    <p className="text-sm mt-3">
                      <strong>Privacy Policy:</strong>{" "}
                      <a
                        href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        GitHub Privacy Statement
                      </a>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Stripe (Payment Processing)
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      <strong>Purpose:</strong> Payment processing and fraud prevention
                    </p>
                    <p className="text-muted-foreground text-sm">
                      When you make a payment, Stripe sets cookies to securely process your
                      transaction and prevent fraud. Stripe does not store your credit card
                      information on our servers.
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      <strong>Important:</strong>{" "}
                      Stripe is PCI DSS Level 1 certified, meaning your payment data is handled with
                      the highest security standards.
                    </p>
                    <p className="text-sm mt-3">
                      <strong>Privacy Policy:</strong>{" "}
                      <a
                        href="https://stripe.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Stripe Privacy Center
                      </a>
                    </p>
                    <p className="text-sm">
                      <strong>Cookies Policy:</strong>{" "}
                      <a
                        href="https://stripe.com/cookies-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Stripe Cookies Policy
                      </a>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Your Control Over Third-Party Cookies
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    While we cannot disable these cookies (they are necessary for authentication and
                    payments), you can:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                    <li>
                      Block cookies from these services in your browser settings
                    </li>
                    <li>
                      Review each service's privacy policy and cookie policy
                    </li>
                    <li>
                      Use private/incognito browsing to prevent persistent cookies
                    </li>
                    <li>
                      Adjust your privacy settings in each service's account
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Managing Cookies */}
          <section id="managing-cookies">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Managing Cookies</CardTitle>
                <CardDescription>
                  How to control cookies in your browser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Browser-Specific Instructions
                  </h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm mb-2">
                        Google Chrome
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-sm">
                        <li>Click Menu (three dots) in the top right corner</li>
                        <li>Select Settings</li>
                        <li>Click Privacy and security</li>
                        <li>Click Cookies and other site data</li>
                        <li>Choose your preferred cookie settings</li>
                      </ol>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm mb-2">Firefox</h4>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-sm">
                        <li>
                          Click Menu (three lines) in the top right corner
                        </li>
                        <li>Select Settings</li>
                        <li>Click Privacy & Security</li>
                        <li>Scroll to Cookies and Site Data</li>
                        <li>Choose your preferred cookie settings</li>
                      </ol>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm mb-2">Safari</h4>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-sm">
                        <li>Click Safari menu</li>
                        <li>Select Settings</li>
                        <li>Click Privacy tab</li>
                        <li>Adjust cookie preferences</li>
                      </ol>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm mb-2">
                        Microsoft Edge
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-sm">
                        <li>Click Menu (three dots) in the top right corner</li>
                        <li>Select Settings</li>
                        <li>Click Privacy, search, and services</li>
                        <li>Scroll to Clear browsing data</li>
                        <li>Configure cookie settings</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    What Happens If You Disable Cookies
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-yellow-900/50 border border-yellow-700 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-100 text-sm mb-2">
                        Impact on Functionality
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-yellow-200 text-sm">
                        <li>You will not be able to log in to your account</li>
                        <li>Google and GitHub authentication will not work</li>
                        <li>Payment processing may be blocked</li>
                        <li>
                          Your session will not persist across page visits
                        </li>
                        <li>Some features may not function correctly</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Clearing Cookies
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    You can clear cookies from your device at any time:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                    <li>
                      Use your browser's "Clear browsing data" feature (typically Ctrl+Shift+Delete
                      or Cmd+Shift+Delete)
                    </li>
                    <li>
                      Select "Cookies and other site data" in the clear browsing data dialog
                    </li>
                    <li>
                      Choose the time range (all time, last hour, last day, etc.)
                    </li>
                    <li>Click Clear or Delete</li>
                  </ul>
                  <p className="text-muted-foreground text-sm mt-4">
                    <strong>Note:</strong>{" "}
                    Clearing cookies will log you out of your account and may reset your
                    preferences.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Do Not Track (DNT)
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Most browsers allow you to send a "Do Not Track" signal to websites. While we
                    respect this preference, some features may require cookies to function properly.
                    You can enable DNT through your browser settings under Privacy or Advanced
                    preferences.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cookie Consent */}
          <section id="consent">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Cookie Consent</CardTitle>
                <CardDescription>
                  How we obtain and manage your cookie preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    How We Obtain Consent
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    When you first visit the Pixel (Spike Land):
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>A cookie consent banner appears on your screen</li>
                    <li>
                      Essential cookies are set immediately (required for functionality)
                    </li>
                    <li>
                      You can choose to accept or reject analytics cookies
                    </li>
                    <li>You can customize your cookie preferences</li>
                    <li>Your choice is saved in your browser</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Cookie Banner Options
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm">Accept All</h4>
                      <p className="text-muted-foreground text-sm">
                        Accept all cookies, including analytics and performance tracking.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm">
                        Reject Non-Essential
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Accept only essential cookies. Analytics and non-essential cookies are
                        blocked.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm">Customize</h4>
                      <p className="text-muted-foreground text-sm">
                        Choose which specific cookie categories to accept or reject.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    GDPR and ePrivacy Compliance
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Our cookie consent implementation complies with GDPR Article 7 and the ePrivacy
                    Directive requirements:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm mt-3">
                    <li>Consent must be freely given (not forced)</li>
                    <li>
                      Consent must be specific (separate from other terms)
                    </li>
                    <li>
                      Consent must be informed (clear information provided)
                    </li>
                    <li>Consent must be affirmative (clear action required)</li>
                    <li>You can withdraw consent at any time</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Withdraw or Change Consent
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    You can change your cookie preferences at any time:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
                    <li>
                      Look for a "Cookie Settings" link at the bottom of the page (typically in the
                      footer)
                    </li>
                    <li>Click the link to open the cookie preferences modal</li>
                    <li>Adjust your cookie settings as desired</li>
                    <li>Click "Save Preferences"</li>
                    <li>
                      Your new preferences are saved and take effect immediately
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Cookie Consent Expiration
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Your cookie consent preferences are stored for 12 months. After 12 months, we
                    may ask you to confirm your preferences again to ensure they remain current.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Consent for Non-EU Users
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    While GDPR applies primarily to EU residents, we apply the same consent
                    standards to all users regardless of location, as this is a best practice for
                    privacy protection.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Policy Updates */}
          <section id="updates">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Policy Updates</CardTitle>
                <CardDescription>Changes to our cookie policy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Right to Modify
                  </h3>
                  <p className="text-muted-foreground">
                    We may update this Cookie Policy at any time to reflect:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
                    <li>Changes in our cookie usage practices</li>
                    <li>New third-party services we use</li>
                    <li>Changes to regulations or legal requirements</li>
                    <li>Improvements to our privacy and security practices</li>
                    <li>Feedback from our users</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    How We Notify You
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    When we make material changes to this Cookie Policy:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                    <li>
                      We will update the "Last updated" date at the top of this page
                    </li>
                    <li>
                      We will post a notice on our website for at least 30 days
                    </li>
                    <li>
                      For significant changes, we may send an email notification to registered users
                    </li>
                    <li>We will ask for renewed consent if required by law</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Version History
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    We maintain a version history of this policy. If you need to reference a
                    previous version, please contact our privacy team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section id="contact">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Contact Us</CardTitle>
                <CardDescription>Questions about cookies?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Privacy Inquiries
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">
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
                    Cookie Preferences
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-muted-foreground text-sm">
                      To change your cookie preferences at any time, look for the "Cookie Settings"
                      link at the bottom of the page or contact us at the email above.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Related Policies
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    For more information about how we handle your data, please review:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Regulatory Authorities
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    If you have concerns about our cookie practices:
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
                          Information Commissioner's Office (ICO)
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
                This Cookie Policy is a template for informational purposes only. It provides
                general guidance on cookie practices and compliance with GDPR and ePrivacy
                regulations. However, cookie laws are complex and evolve frequently. You should
                consult with a qualified attorney who specializes in privacy and data protection law
                to ensure this policy is fully compliant with all applicable laws in your
                jurisdiction and to customize it for your specific cookie usage and business
                operations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
