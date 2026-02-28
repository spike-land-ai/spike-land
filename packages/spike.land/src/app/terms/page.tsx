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
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "account-terms", title: "Account Terms" },
  { id: "user-responsibilities", title: "User Responsibilities" },
  { id: "token-economy", title: "Token Economy" },
  { id: "service-description", title: "Service Description" },
  { id: "acceptable-use", title: "Acceptable Use Policy" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "payment-terms", title: "Payment Terms" },
  { id: "limitation-liability", title: "Limitation of Liability" },
  { id: "dispute-resolution", title: "Dispute Resolution" },
  { id: "changes-terms", title: "Changes to Terms" },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto pt-24 pb-12 px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
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
              Quick navigation to our terms of service sections
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
          {/* Acceptance of Terms */}
          <section id="acceptance">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Agreement</h3>
                  <p>
                    By accessing and using the Pixel (Spike Land) (&quot;Service&quot;), you agree
                    to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree
                    to these Terms, please do not use the Service.
                  </p>
                  <p className="mt-3">
                    These Terms constitute the entire agreement between you and SPIKE LAND LTD
                    (&quot;Operator&quot;, Company Number 16906682) regarding the Service and
                    supersede all prior agreements and understandings.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Age Requirement
                  </h3>
                  <p>
                    You must be at least 13 years of age to use this Service. If you are under 13,
                    you may not create an account or use the Service. By using the Service, you
                    represent and warrant that you are at least 13 years old or have obtained
                    parental consent.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Capacity to Agree
                  </h3>
                  <p>
                    You represent and warrant that you have the legal capacity to enter into these
                    Terms and are not prohibited by law from using the Service. If you are using the
                    Service on behalf of an organization, you represent that you have the authority
                    to bind that organization to these Terms.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-muted-foreground text-sm">
                    <strong>Operator:</strong> SPIKE LAND LTD (Company Number 16906682)
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    <strong>Registered Office:</strong> United Kingdom
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    <strong>Contact:</strong> hello@spike.land
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    <strong>Jurisdiction:</strong>{" "}
                    These Terms are governed by the laws of the United Kingdom and comply with UK
                    consumer protection regulations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Account Terms */}
          <section id="account-terms">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Account Terms</CardTitle>
                <CardDescription>
                  Your account rights and responsibilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Account Creation
                  </h3>
                  <p>
                    You can create an account using OAuth authentication providers, including GitHub
                    and Google. We collect only the information necessary to operate your account:
                    email address, name, and profile image provided by your OAuth provider.
                  </p>
                  <p className="mt-3">
                    You agree to provide accurate, current, and complete information during
                    registration and to update it as needed.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Account Security
                  </h3>
                  <div className="space-y-3">
                    <p>
                      You are solely responsible for:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
                      <li>
                        Maintaining the confidentiality of your OAuth credentials
                      </li>
                      <li>Preventing unauthorized access to your account</li>
                      <li>Notifying us immediately of unauthorized access</li>
                      <li>All activities that occur under your account</li>
                    </ul>
                    <p className="pt-2">
                      We are not responsible for any loss or damage resulting from your failure to
                      maintain account security.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    One Account Per Person
                  </h3>
                  <p>
                    You may maintain only one personal account on the Service. Creating multiple
                    accounts to circumvent token limits, rate limits, or other restrictions is
                    prohibited and may result in immediate suspension of all accounts.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Account Termination
                  </h3>
                  <div className="space-y-3">
                    <p>
                      We reserve the right to terminate or suspend your account at any time for:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
                      <li>Violation of these Terms</li>
                      <li>Violation of our Acceptable Use Policy</li>
                      <li>Suspicious activity indicating fraud or misuse</li>
                      <li>
                        Failure to pay for services within 30 days of invoice
                      </li>
                      <li>Non-compliance with legal requirements</li>
                    </ul>
                    <p className="pt-2">
                      You may delete your account at any time through your account settings. Upon
                      deletion, your account will be disabled immediately, and your data will be
                      removed according to our Privacy Policy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* User Responsibilities */}
          <section id="user-responsibilities">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  User Responsibilities
                </CardTitle>
                <CardDescription>
                  Your obligations when using the Service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    General Obligations
                  </h3>
                  <p>
                    As a user of the Pixel (Spike Land), you are responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>
                      Ensuring all images you upload comply with our Acceptable Use Policy
                    </li>
                    <li>
                      Maintaining the security of your account credentials
                    </li>
                    <li>
                      Using the Service in accordance with all applicable laws and regulations
                    </li>
                    <li>
                      Respecting the intellectual property rights of others
                    </li>
                    <li>
                      Reporting any security vulnerabilities or bugs you discover
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Content Responsibility
                  </h3>
                  <p>
                    You are solely responsible for all content you upload, enhance, or share through
                    the Service. This includes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>
                      Ensuring you have the right to upload and modify images
                    </li>
                    <li>
                      Verifying that content does not violate third-party rights
                    </li>
                    <li>Backing up your original images before enhancement</li>
                    <li>Not uploading malicious files or content</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Compliance</h3>
                  <p>
                    You must comply with all applicable local, national, and international laws when
                    using the Service. You are responsible for understanding and adhering to
                    regulations that apply in your jurisdiction.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Token Economy */}
          <section id="token-economy">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Token Economy</CardTitle>
                <CardDescription>
                  How tokens work and token policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    What Are Tokens
                  </h3>
                  <p>
                    Tokens are the currency used to purchase image enhancement services on the Spike
                    Land platform. Tokens are non-refundable and non-transferable digital units with
                    no monetary value outside the Service.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Free Token Generation
                  </h3>
                  <div className="space-y-3">
                    <p>
                      All users receive free tokens according to the following schedule:
                    </p>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      <p>
                        <strong>Generation Rate:</strong> 1 token per 15 minutes
                      </p>
                      <p>
                        <strong>Maximum Balance:</strong> 100 tokens
                      </p>
                      <p>
                        <strong>Regeneration:</strong> Automatic
                      </p>
                      <p className="text-muted-foreground">
                        Free tokens cannot be carried over beyond the 100-token maximum. Once you
                        reach the limit, token generation pauses until you use tokens to bring your
                        balance below 100.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Purchased Tokens
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Never Expire</h4>
                      <p className="text-muted-foreground text-sm">
                        Purchased tokens remain valid indefinitely and do not expire.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Non-Refundable</h4>
                      <p className="text-muted-foreground text-sm">
                        Purchased tokens cannot be refunded, except in cases of failed enhancements
                        where we are unable to process your enhancement request due to a service
                        error. In such cases, tokens will be automatically credited back to your
                        account.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Non-Transferable</h4>
                      <p className="text-muted-foreground text-sm">
                        Tokens cannot be transferred between accounts or to other users. Your tokens
                        are strictly for your own use.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Token Pricing</h3>
                  <p className="mb-4">
                    Token prices are subject to change without notice. We will provide notice of
                    material price increases via email or in-app notification.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-2">Tokens</th>
                          <th className="text-left py-2">Price (GBP)</th>
                          <th className="text-left py-2">Cost Per Token</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b border-border">
                          <td className="py-2">10 tokens</td>
                          <td>£1.99</td>
                          <td>£0.199</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">50 tokens</td>
                          <td>£8.99</td>
                          <td>£0.180</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">100 tokens</td>
                          <td>£15.99</td>
                          <td>£0.160</td>
                        </tr>
                        <tr>
                          <td className="py-2">500 tokens</td>
                          <td>£69.99</td>
                          <td>£0.140</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Token Usage</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-2">Enhancement Tier</th>
                          <th className="text-left py-2">Resolution</th>
                          <th className="text-left py-2">Tokens Required</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b border-border">
                          <td className="py-2">Tier 1</td>
                          <td>1K (1024x1024)</td>
                          <td>5 tokens</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2">Tier 2</td>
                          <td>2K (2048x2048)</td>
                          <td>10 tokens</td>
                        </tr>
                        <tr>
                          <td className="py-2">Tier 3</td>
                          <td>4K (4096x4096)</td>
                          <td>20 tokens</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Service Description */}
          <section id="service-description">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Service Description</CardTitle>
                <CardDescription>
                  What the Service provides and its limitations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Overview</h3>
                  <p>
                    The Pixel (Spike Land) is an AI-powered image processing service that uses
                    Google Gemini to enhance uploaded images. The Service allows users to upload
                    images and receive enhanced versions at three different resolution tiers.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Enhancement Tiers
                  </h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">
                        1K Enhancement (1024x1024)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Standard resolution enhancement suitable for web use. Requires 5 tokens.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">
                        2K Enhancement (2048x2048)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        High-resolution enhancement suitable for printing and professional use.
                        Requires 10 tokens.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">
                        4K Enhancement (4096x4096)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Ultra-high resolution enhancement for premium quality. Requires 20 tokens.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Processing Technology
                  </h3>
                  <p>
                    Image enhancements are processed using Google Gemini API. When you request an
                    enhancement, your image is sent to Google&apos;s servers for processing. By
                    using this Service, you consent to this processing.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    No Guarantee of Specific Results
                  </h3>
                  <p>
                    The Service is provided &quot;as is&quot; without any warranty regarding the
                    quality, accuracy, or suitability of enhanced images. AI-powered image
                    enhancement is not deterministic, and results may vary based on:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Input image quality and content</li>
                    <li>Google Gemini API accuracy and updates</li>
                    <li>System performance and resource availability</li>
                    <li>Other factors beyond our control</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Service Availability
                  </h3>
                  <p>
                    We do not guarantee uninterrupted or error-free service. The Service may be
                    unavailable due to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Scheduled maintenance</li>
                    <li>Unplanned outages or service disruptions</li>
                    <li>Google Gemini API unavailability</li>
                    <li>Internet connectivity issues</li>
                    <li>Force majeure events</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Acceptable Use Policy */}
          <section id="acceptable-use">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Acceptable Use Policy
                </CardTitle>
                <CardDescription>
                  What you cannot do with the Service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Prohibited Content
                  </h3>
                  <p className="mb-4">
                    You agree not to upload, enhance, or share images that contain:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
                    <li>
                      <strong>Illegal content:</strong>{" "}
                      Material that violates UK or international law
                    </li>
                    <li>
                      <strong>Child exploitation:</strong>{" "}
                      Any form of child sexual abuse material (CSAM) or content sexualizing minors
                    </li>
                    <li>
                      <strong>Malware or exploits:</strong>{" "}
                      Code, binaries, or instructions for hacking, malware, or unauthorized access
                    </li>
                    <li>
                      <strong>Harassment or abuse:</strong>{" "}
                      Content threatening, harassing, or defaming individuals
                    </li>
                    <li>
                      <strong>Hateful content:</strong>{" "}
                      Content promoting discrimination based on protected characteristics
                    </li>
                    <li>
                      <strong>Non-consensual intimate content:</strong>{" "}
                      Sexual images shared without consent
                    </li>
                    <li>
                      <strong>Spam:</strong> Repetitive or unsolicited content
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Copyright Compliance
                  </h3>
                  <p>
                    You represent and warrant that you own or have all necessary rights to use
                    images you upload. You are solely responsible for ensuring your uploaded images
                    do not infringe on the intellectual property rights of others.
                  </p>
                  <p className="mt-3">
                    If you believe content infringes your rights, please contact us at
                    hello@spike.land with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Identification of the infringing content</li>
                    <li>Proof of your ownership or rights</li>
                    <li>Your contact information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Misuse Prevention
                  </h3>
                  <p>
                    You agree not to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>
                      Circumvent rate limits or token limits by creating multiple accounts
                    </li>
                    <li>
                      Attempt to gain unauthorized access to the Service or other accounts
                    </li>
                    <li>
                      Use automated tools to scrape or bulk download content
                    </li>
                    <li>
                      Interfere with the Service&apos;s operation or infrastructure
                    </li>
                    <li>
                      Reverse engineer or attempt to extract proprietary technology
                    </li>
                    <li>
                      Use the Service for commercial purposes without permission
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Rate Limiting Enforcement
                  </h3>
                  <p>
                    We enforce strict rate limits to maintain service quality for all users.
                    Violating rate limits will result in temporary account suspension. Limits
                    include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>20 image uploads per hour per user</li>
                    <li>100 API requests per minute per user</li>
                    <li>200 enhancement requests per 24 hours per user</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Enforcement and Termination
                  </h3>
                  <p>
                    We reserve the right to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>
                      Immediately suspend or terminate your account for policy violations
                    </li>
                    <li>Delete prohibited content without notice</li>
                    <li>Refuse service to repeat violators</li>
                    <li>Report illegal content to appropriate authorities</li>
                    <li>Monitor Service use for compliance with these Terms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Intellectual Property */}
          <section id="intellectual-property">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Intellectual Property
                </CardTitle>
                <CardDescription>
                  Ownership of images and content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    User Image Ownership
                  </h3>
                  <p>
                    You retain all intellectual property rights and ownership of images you upload
                    to the Service. We do not claim ownership of your images.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Platform License Grant
                  </h3>
                  <p>
                    By uploading images, you grant the Operator a limited, non-exclusive, revocable
                    license to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Process and enhance your images using the Service</li>
                    <li>
                      Store your images on secure servers for the purposes of providing the Service
                    </li>
                    <li>
                      Transmit images to third-party processors (Google Gemini) for enhancement
                    </li>
                    <li>Delete images according to our retention policies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">No AI Training</h3>
                  <p>
                    We explicitly guarantee that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>
                      Your images are NOT used to train AI models (ours or third parties)
                    </li>
                    <li>
                      Your images are NOT used for machine learning research
                    </li>
                    <li>
                      Your images are NOT sold or shared for commercial purposes
                    </li>
                    <li>
                      Your images are NOT analyzed for facial recognition training
                    </li>
                  </ul>
                  <p className="pt-4">
                    Google Gemini processes your images according to their own privacy terms.
                    Consult Google&apos;s terms for details on their use of images during
                    processing.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Service Intellectual Property
                  </h3>
                  <p>
                    The Spike Land platform, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Software code and algorithms</li>
                    <li>User interface design</li>
                    <li>Documentation and guides</li>
                    <li>Trade secrets and proprietary technology</li>
                  </ul>
                  <p className="pt-4">
                    ...are owned by the Operator and protected by copyright. You may not copy,
                    distribute, or create derivative works without permission.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Payment Terms */}
          <section id="payment-terms">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Payment Terms</CardTitle>
                <CardDescription>
                  Pricing, billing, and refund policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Currency and Pricing
                  </h3>
                  <p>
                    All prices are displayed in British Pounds Sterling (GBP). Prices are subject to
                    change without notice. Significant price changes will be communicated via email
                    or in-app notification.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Payment Processing
                  </h3>
                  <p>
                    Token purchases are processed through Stripe, a PCI DSS Level 1 compliant
                    payment processor. We do not store your credit card information. Stripe handles
                    all payment data securely according to their terms and privacy policy.
                  </p>
                  <p className="mt-3">
                    By making a purchase, you authorize the Operator and Stripe to charge your
                    payment method for the token package you select.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Automatic Subscription Renewal
                  </h3>
                  <p>
                    If you enable automatic token renewals (if offered), your payment method will be
                    charged automatically at the interval you select. You can cancel automatic
                    renewals at any time through your account settings or by contacting us.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Refund Policy</h3>
                  <p className="mb-4">
                    Token purchases are generally non-refundable. However, refunds may be issued in
                    the following cases:
                  </p>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Failed Enhancement</h4>
                      <p className="text-muted-foreground text-sm">
                        If an enhancement request fails due to a service error (not user error),
                        tokens will be automatically credited back to your account within 24 hours.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Billing Error</h4>
                      <p className="text-muted-foreground text-sm">
                        If you are charged twice or charged incorrectly due to our error, we will
                        issue a refund within 7 business days after investigation and verification.
                      </p>
                    </div>
                  </div>
                  <p className="pt-4">
                    In all other cases, token purchases are final and non-refundable. Tokens are
                    virtual currency and have no real monetary value outside the Service.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Payment Disputes
                  </h3>
                  <p>
                    If you dispute a charge with your card issuer (chargeback), we reserve the right
                    to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Suspend your account pending investigation</li>
                    <li>
                      Demand repayment of any chargeback fees (typically £20-50)
                    </li>
                    <li>Terminate your account permanently</li>
                    <li>Refuse future service to you</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Taxes</h3>
                  <p>
                    Prices displayed include VAT (Value Added Tax) if applicable in your
                    jurisdiction. You are responsible for any additional taxes or duties imposed by
                    your government.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Limitation of Liability */}
          <section id="limitation-liability">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Limitation of Liability
                </CardTitle>
                <CardDescription>Our liability and disclaimers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Service Provided &quot;As Is&quot;
                  </h3>
                  <p>
                    The Service is provided &quot;AS IS&quot; without warranties of any kind,
                    express or implied. We make no representations about the accuracy, reliability,
                    suitability, or completeness of the Service.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    No Warranty of Results
                  </h3>
                  <p>
                    We do not warrant that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Image enhancements will meet your expectations</li>
                    <li>
                      Enhanced images will be suitable for your intended use
                    </li>
                    <li>The Service will be error-free or uninterrupted</li>
                    <li>Defects in the Service will be corrected</li>
                    <li>The Service will be compatible with your equipment</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Disclaimer of Consequential Damages
                  </h3>
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL THE OPERATOR BE LIABLE
                    FOR:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3 uppercase text-sm">
                    <li>Lost profits or revenue</li>
                    <li>Lost business opportunities</li>
                    <li>Lost data or data corruption</li>
                    <li>
                      Indirect, incidental, special, or consequential damages
                    </li>
                    <li>
                      Damages arising from use or inability to use the Service
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Maximum Liability
                  </h3>
                  <p>
                    Our total liability under these Terms shall not exceed the total amount you have
                    paid to us in the 12 months preceding the event giving rise to liability, or
                    £100, whichever is greater.
                  </p>
                  <p className="mt-3">
                    Some jurisdictions do not allow limitation of liability, in which case this
                    limitation may not apply to you.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Force Majeure</h3>
                  <p>
                    We are not liable for any failure or delay in performance under these Terms
                    caused by events beyond our reasonable control, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Natural disasters, acts of God</li>
                    <li>War, terrorism, civil unrest</li>
                    <li>Pandemics or epidemics</li>
                    <li>Government actions or restrictions</li>
                    <li>
                      Third-party service outages (Google, Stripe, Cloudflare)
                    </li>
                    <li>Internet infrastructure failures</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Indemnification
                  </h3>
                  <p>
                    You agree to indemnify and hold harmless the Operator from any claims, damages,
                    or costs (including attorney fees) arising from:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Your use of the Service</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of applicable law</li>
                    <li>Infringement claims related to your uploaded images</li>
                    <li>Your misuse of the Service</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Dispute Resolution */}
          <section id="dispute-resolution">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Dispute Resolution</CardTitle>
                <CardDescription>How disputes are resolved</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Governing Law</h3>
                  <p>
                    These Terms are governed by and construed in accordance with the laws of the
                    United Kingdom, without regard to its conflict of laws provisions.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Informal Resolution
                  </h3>
                  <p>
                    Before pursuing any legal action, both parties agree to attempt to resolve
                    disputes through informal negotiation. Please contact us at hello@spike.land
                    with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>A detailed description of the dispute</li>
                    <li>The resolution you are seeking</li>
                    <li>Any relevant documentation or evidence</li>
                  </ul>
                  <p className="pt-4">
                    We will respond within 30 days. Most disputes are resolved at this stage.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Jurisdiction and Venue
                  </h3>
                  <p>
                    Any legal action or proceeding arising under these Terms shall be brought
                    exclusively in the courts of England and Wales, and both parties consent to the
                    exclusive jurisdiction of these courts.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Legal Remedies</h3>
                  <p>
                    You agree that your sole and exclusive remedy for any dispute is the refund of
                    amounts paid, as set forth in our refund policy. You waive any right to
                    injunctive relief, class action, or punitive damages.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Severability</h3>
                  <p>
                    If any provision of these Terms is found to be invalid or unenforceable, the
                    remaining provisions shall remain in full force and effect. The invalid
                    provision shall be modified to the minimum extent necessary to make it valid.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Changes to Terms */}
          <section id="changes-terms">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Changes to Terms</CardTitle>
                <CardDescription>How we update these Terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Right to Modify
                  </h3>
                  <p>
                    We reserve the right to modify these Terms at any time. Changes are effective
                    immediately upon posting to the Service.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Notice of Changes
                  </h3>
                  <p>
                    For material changes, we will provide notice by:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Emailing you at your registered email address</li>
                    <li>Displaying a prominent notice on the Service</li>
                    <li>
                      Updating the &quot;Last Updated&quot; date at the top of this page
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Continued Use Constitutes Acceptance
                  </h3>
                  <p>
                    Your continued use of the Service after changes become effective constitutes
                    your acceptance of the modified Terms. If you do not agree to any modifications,
                    you must stop using the Service.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Material Changes
                  </h3>
                  <p>
                    Material changes include those that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground mt-3">
                    <li>Increase fees or token costs by more than 10%</li>
                    <li>Reduce your privacy protections</li>
                    <li>Change token refund policies</li>
                    <li>Modify limitation of liability provisions</li>
                    <li>Change governing law or dispute resolution</li>
                  </ul>
                  <p className="pt-4">
                    For material changes, we provide at least 30 days notice before implementation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Legal Disclaimer */}
          <Card className="bg-yellow-900/50 border-yellow-700">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-100">
                Legal Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-200">
                These Terms of Service are a template for informational purposes only. They provide
                general guidance on service terms and conditions but are not comprehensive. Laws and
                regulations vary by jurisdiction and change frequently. You should consult with a
                qualified attorney who specializes in technology law and consumer protection to
                ensure these Terms are fully compliant with all applicable laws in your jurisdiction
                and to customize them for your specific business model, pricing, and operations.
                This template should not be used without professional legal review.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
