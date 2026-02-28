"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const sections = [
  { id: "welcome", title: "Welcome" },
  { id: "code-of-conduct", title: "Code of Conduct" },
  { id: "contributing", title: "Contributing" },
  { id: "support", title: "Getting Support" },
  { id: "social-guidelines", title: "Social Media Guidelines" },
  { id: "recognition", title: "Community Recognition" },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto pt-24 pb-12 px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Community Guidelines</h1>
          <p className="text-muted-foreground text-lg">
            Welcome to the spike.land community! These guidelines help us maintain a positive and
            productive environment for everyone.
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Table of Contents</CardTitle>
            <CardDescription>
              Quick navigation to our community guidelines
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
          {/* Welcome */}
          <section id="welcome">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Welcome to spike.land
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  spike.land is an AI-powered creative platform that helps you enhance images and
                  build amazing applications through &quot;vibe coding.&quot; Our community is made
                  up of creators, developers, photographers, and innovators from around the world.
                </p>
                <p>
                  We believe in fostering an inclusive, respectful, and collaborative environment
                  where everyone can learn, create, and grow together.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Our Core Values</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      <strong>Creativity:</strong> We celebrate innovation and creative expression
                    </li>
                    <li>
                      <strong>Respect:</strong> We treat everyone with dignity and kindness
                    </li>
                    <li>
                      <strong>Collaboration:</strong> We help each other succeed
                    </li>
                    <li>
                      <strong>Transparency:</strong> We communicate openly and honestly
                    </li>
                    <li>
                      <strong>Quality:</strong> We strive for excellence in everything we do
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Code of Conduct */}
          <section id="code-of-conduct">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Code of Conduct</CardTitle>
                <CardDescription>
                  Expected behavior in our community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-green-400">
                    ✓ Do
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Be respectful and considerate in all interactions
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Provide constructive feedback that helps others improve
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Share knowledge and help newcomers get started
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Respect intellectual property and give credit where due
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>Report issues and bugs constructively</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Celebrate others&apos; achievements and successes
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 text-red-400">
                    ✗ Don&apos;t
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Harass, bully, or discriminate against others</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>
                        Share offensive, inappropriate, or harmful content
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Spam or post irrelevant promotional content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>
                        Share others&apos; personal information without consent
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Misuse the platform for illegal activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>
                        Attempt to circumvent security or abuse the service
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-700">
                  <h4 className="font-semibold text-yellow-200 mb-2">
                    Enforcement
                  </h4>
                  <p className="text-sm text-yellow-300">
                    Violations of this code of conduct may result in warnings, temporary suspension,
                    or permanent ban from the platform. We take community safety seriously and will
                    act to protect our members.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contributing */}
          <section id="contributing">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Contributing</CardTitle>
                <CardDescription>
                  How to contribute to spike.land
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  We welcome contributions from the community! There are many ways you can help make
                  spike.land better:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Report Bugs</h4>
                    <p className="text-muted-foreground text-sm">
                      Found a bug? Open an issue on our GitHub repository with steps to reproduce.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Suggest Features</h4>
                    <p className="text-muted-foreground text-sm">
                      Have an idea? Share it on GitHub or our Discord community.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Write Code</h4>
                    <p className="text-muted-foreground text-sm">
                      Submit pull requests for bug fixes or new features.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Improve Documentation</h4>
                    <p className="text-muted-foreground text-sm">
                      Help us improve our docs and tutorials.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Share Your Work</h4>
                    <p className="text-muted-foreground text-sm">
                      Showcase what you&apos;ve built with spike.land.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Help Others</h4>
                    <p className="text-muted-foreground text-sm">
                      Answer questions and help newcomers in Discord.
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    Contribution Guidelines
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Fork the repository on GitHub</li>
                    <li>Create a feature branch for your changes</li>
                    <li>Write clear, documented code with tests</li>
                    <li>Submit a pull request with a descriptive title</li>
                    <li>Respond to feedback and iterate</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Getting Support */}
          <section id="support">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Getting Support</CardTitle>
                <CardDescription>
                  Where to get help when you need it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">🔍 Documentation</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Check our docs for guides, tutorials, and API references.
                    </p>
                    <Link
                      href="/docs"
                      className="text-primary hover:underline text-sm"
                    >
                      Browse Documentation →
                    </Link>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">💬 Discord</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Join our Discord for real-time help and community chat.
                    </p>
                    <a
                      href="https://discord.gg/spikeland"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Join Discord →
                    </a>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">🐛 GitHub Issues</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Report bugs or request features on GitHub.
                    </p>
                    <a
                      href="https://github.com/spike-land-ai/spike.land/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Open an Issue →
                    </a>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">📧 Email</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      For private inquiries, reach out via email.
                    </p>
                    <a
                      href="mailto:hello@spike.land"
                      className="text-primary hover:underline text-sm"
                    >
                      hello@spike.land →
                    </a>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Response Times</h4>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>
                      <strong>Discord:</strong> Usually within hours (community-driven)
                    </li>
                    <li>
                      <strong>GitHub:</strong> 1-3 business days
                    </li>
                    <li>
                      <strong>Email:</strong> 1-2 business days
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Social Media Guidelines */}
          <section id="social-guidelines">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Social Media Guidelines
                </CardTitle>
                <CardDescription>
                  How to engage with us on social platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  We love connecting with our community across social media! Here&apos;s how to
                  engage with us:
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">Share Your Creations</h4>
                    <p className="text-muted-foreground text-sm">
                      Tag us in your posts and use <strong>#spikeland</strong> or{" "}
                      <strong>#PixelBySpikeLand</strong> to get featured.
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">Ask Questions</h4>
                    <p className="text-muted-foreground text-sm">
                      We monitor mentions and DMs on all platforms. Feel free to reach out!
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">Give Feedback</h4>
                    <p className="text-muted-foreground text-sm">
                      We read all feedback and use it to improve our platform.
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Our Hashtags</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      #spikeland
                    </span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      #PixelBySpikeLand
                    </span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      #VibeCoding
                    </span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      #AIImageEnhancement
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm">
                  Find us on all platforms:{" "}
                  <Link href="/social" className="text-primary hover:underline">
                    View our social accounts →
                  </Link>
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Community Recognition */}
          <section id="recognition">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Community Recognition
                </CardTitle>
                <CardDescription>
                  How we celebrate our community members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  We love recognizing community members who go above and beyond. Here are some ways
                  we celebrate contributions:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-amber-800 bg-amber-900/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-300 mb-2">
                      🌟 Featured Creators
                    </h4>
                    <p className="text-sm text-amber-400">
                      Outstanding work showcased on our social media and gallery.
                    </p>
                  </div>
                  <div className="border border-purple-800 bg-purple-900/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-300 mb-2">
                      💜 Community Contributors
                    </h4>
                    <p className="text-sm text-purple-400">
                      Special recognition for those who help others and contribute code.
                    </p>
                  </div>
                  <div className="border border-green-800 bg-green-900/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-300 mb-2">
                      🎁 Token Rewards
                    </h4>
                    <p className="text-sm text-green-400">
                      Bonus tokens for significant contributions and bug reports.
                    </p>
                  </div>
                  <div className="border border-blue-800 bg-blue-900/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-300 mb-2">
                      🎉 Shoutouts
                    </h4>
                    <p className="text-sm text-blue-400">
                      Regular shoutouts in our newsletter and social channels.
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-muted-foreground">
                    Want to nominate someone? Let us know at{" "}
                    <a
                      href="mailto:hello@spike.land"
                      className="text-primary hover:underline"
                    >
                      hello@spike.land
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Final Note */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Thank You!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Thank you for being part of the spike.land community. Together, we&apos;re building
                something amazing. If you have suggestions for improving these guidelines, we&apos;d
                love to hear from you!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
