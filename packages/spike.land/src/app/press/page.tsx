"use client";

import { PixelLogo, SpikeLandLogo } from "@/components/brand";
import { ImageComparisonSlider } from "@/components/enhance/ImageComparisonSlider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Copy, Download, Github, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Brand colors
const brandColors = [
  {
    name: "Primary (Amber)",
    hex: "#F59E0B",
    rgb: "245, 158, 11",
    usage: "Main brand color, CTAs, highlights",
  },
  {
    name: "Primary Light",
    hex: "#FBBF24",
    rgb: "251, 191, 36",
    usage: "Hover states, accents",
  },
  {
    name: "Primary Dark",
    hex: "#D97706",
    rgb: "217, 119, 6",
    usage: "Active states, emphasis",
  },
  {
    name: "Background",
    hex: "#FFFFFF",
    rgb: "255, 255, 255",
    usage: "Light mode background",
  },
  {
    name: "Background Dark",
    hex: "#0A0A0A",
    rgb: "10, 10, 10",
    usage: "Dark mode background",
  },
  {
    name: "Text Primary",
    hex: "#171717",
    rgb: "23, 23, 23",
    usage: "Primary text (light mode)",
  },
  {
    name: "Text Primary Dark",
    hex: "#FAFAFA",
    rgb: "250, 250, 250",
    usage: "Primary text (dark mode)",
  },
];

// Boilerplate texts
const boilerplates = {
  short: "spike.land is an AI-powered creative platform for image enhancement and vibe coding.",
  medium:
    "spike.land is an AI-powered creative platform that transforms how people create. With Pixel, our flagship product, users can enhance images using AI with unprecedented quality. Our vibe coding platform enables developers to build applications through natural language, making creation accessible to everyone.",
  long:
    `spike.land is an innovative AI-powered creative platform that's transforming how people create digital content. Founded in 2024 and headquartered in the United Kingdom, spike.land combines cutting-edge artificial intelligence with intuitive design to make professional-quality creation accessible to everyone.

Our flagship product, Pixel, uses advanced AI models to enhance images with unprecedented quality—from subtle improvements to dramatic transformations. Whether you're a professional photographer, content creator, or casual user, Pixel helps you achieve stunning results in seconds.

Beyond image enhancement, spike.land pioneers "vibe coding"—a revolutionary approach where developers describe what they want to build in natural language, and AI helps bring their vision to life. This democratizes software development, enabling more people to create functional applications without traditional coding expertise.

At spike.land, we believe in the power of AI to augment human creativity, not replace it. We're building tools that empower creators to do more, faster, while maintaining full creative control.`,
};

const screenshots = [
  {
    title: "VHS to 4K Restoration",
    original:
      "https://pub-cf0adddb5752426a96ef090997e0da95.r2.dev/users/user_49d6efb916aec77949d6efb916aec779/originals/0532f497-5f7d-4b47-8361-ea6e83df817b.png",
    enhanced:
      "https://pub-cf0adddb5752426a96ef090997e0da95.r2.dev/users/user_49d6efb916aec77949d6efb916aec779/enhanced/0532f497-5f7d-4b47-8361-ea6e83df817b/cmj75u2yy000104l2fmdwa5ax.jpg",
  },
  {
    title: "Photo Enhancement",
    original:
      "https://pub-cf0adddb5752426a96ef090997e0da95.r2.dev/users/user_b492619127d7e0c1c8338d243d71a977/originals/5b384972-3086-418e-946a-f9c57e2765c4.jpeg",
    enhanced:
      "https://pub-cf0adddb5752426a96ef090997e0da95.r2.dev/users/user_b492619127d7e0c1c8338d243d71a977/enhanced/5b384972-3086-418e-946a-f9c57e2765c4.jpeg",
  },
];

function ColorSwatch({ color }: { color: typeof brandColors[0]; }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="h-24 w-full"
        style={{ backgroundColor: color.hex }}
      />
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{color.name}</span>
          <button
            onClick={() => copyToClipboard(color.hex)}
            className="p-1 hover:bg-muted rounded"
            title="Copy HEX"
          >
            {copied
              ? <Check className="h-4 w-4 text-green-500" />
              : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>HEX:</strong> {color.hex}
          </p>
          <p>
            <strong>RGB:</strong> {color.rgb}
          </p>
          <p className="text-xs">{color.usage}</p>
        </div>
      </div>
    </div>
  );
}

function CopyableText({ label, text }: { label: string; text: string; }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-muted p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{label}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {copied
            ? <Check className="h-4 w-4" />
            : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}

export default function PressPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto pt-24 pb-12 px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Press & Media Kit</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Everything you need to write about spike.land. Download our logos, access brand
            guidelines, and find key information about our company.
          </p>
        </div>

        {/* Quick Download Section */}
        <Card className="mb-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>Quick Download</CardTitle>
            <CardDescription>
              Download our complete press kit in one package
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button className="gap-2" asChild>
                <a href="/press/press-kit.zip" download>
                  <Download className="h-4 w-4" />
                  Download Full Press Kit (ZIP)
                </a>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <a href="/press/logo-package.zip" download>
                  <Download className="h-4 w-4" />
                  Logo Package Only
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Press kit includes: logos (SVG, PNG), brand colors, screenshots, boilerplate text, and
              usage guidelines.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Logos Section */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Logos</CardTitle>
                  <CardDescription>
                    Download our logos in various formats and sizes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Full Logo */}
                    <div className="border rounded-lg p-6 bg-zinc-900 flex flex-col items-center">
                      <div className="h-16 flex items-center justify-center mb-4">
                        <SpikeLandLogo size="md" variant="horizontal" />
                      </div>
                      <span className="text-sm text-muted-foreground mb-2">
                        Full Logo
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href="/press/logos/spike-land-full.svg" download>
                            SVG
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href="/press/logos/spike-land-full.png" download>
                            PNG
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Icon Only */}
                    <div className="border rounded-lg p-6 bg-zinc-900 flex flex-col items-center">
                      <div className="h-16 flex items-center justify-center mb-4">
                        <SpikeLandLogo size="lg" variant="icon" />
                      </div>
                      <span className="text-sm text-muted-foreground mb-2">
                        Icon Only
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href="/press/logos/spike-land-icon.svg" download>
                            SVG
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href="/press/logos/spike-land-icon-512.png"
                            download
                          >
                            PNG
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Wordmark */}
                    <div className="border rounded-lg p-6 bg-zinc-900 flex flex-col items-center">
                      <div className="h-16 flex items-center justify-center mb-4">
                        <span className="font-heading font-bold text-xl tracking-tight lowercase text-foreground">
                          spike.land
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground mb-2">
                        Wordmark
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href="/press/logos/spike-land-wordmark.svg"
                            download
                          >
                            SVG
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href="/press/logos/spike-land-wordmark.png"
                            download
                          >
                            PNG
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Dark variant */}
                    <div className="border rounded-lg p-6 bg-zinc-900 flex flex-col items-center">
                      <div className="h-16 flex items-center justify-center mb-4">
                        <div className="flex items-center gap-2">
                          <SpikeLandLogo
                            size="md"
                            variant="horizontal"
                            className="text-white"
                          />
                        </div>
                      </div>
                      <span className="text-sm text-zinc-400 mb-2">
                        On Dark
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href="/press/logos/spike-land-dark.svg" download>
                            SVG
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href="/press/logos/spike-land-dark.png" download>
                            PNG
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Pixel Logo */}
                    <div className="border rounded-lg p-6 bg-zinc-900 flex flex-col items-center">
                      <div className="h-16 flex items-center justify-center mb-4">
                        <PixelLogo size="lg" variant="horizontal" />
                      </div>
                      <span className="text-sm text-muted-foreground mb-2">
                        Pixel Product
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href="/press/logos/pixel-logo.svg" download>SVG</a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href="/press/logos/pixel-logo.png" download>PNG</a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Available Sizes</h4>
                    <p className="text-sm text-muted-foreground">
                      PNG icons available in: 16×16, 32×32, 64×64, 128×128, 256×256, and 512×512
                      pixels.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Brand Colors */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Brand Colors</CardTitle>
                  <CardDescription>
                    Our official color palette
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {brandColors.map(color => <ColorSwatch key={color.hex} color={color} />)}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Screenshots */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Screenshots</CardTitle>
                  <CardDescription>
                    Product screenshots and before/after examples
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 gap-8">
                    {screenshots.map((shot, i) => (
                      <div key={i} className="space-y-2">
                        <h3 className="font-semibold text-lg">{shot.title}</h3>
                        <div className="aspect-video w-full rounded-lg overflow-hidden border">
                          <ImageComparisonSlider
                            originalUrl={shot.original}
                            enhancedUrl={shot.enhanced}
                            originalLabel="Original"
                            enhancedLabel="Enhanced"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Boilerplate */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Boilerplate Text</CardTitle>
                  <CardDescription>
                    Ready-to-use descriptions for press releases and articles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <CopyableText
                    label="One-liner (Short)"
                    text={boilerplates.short}
                  />
                  <CopyableText
                    label="Paragraph (Medium)"
                    text={boilerplates.medium}
                  />
                  <CopyableText
                    label="Full Description (Long)"
                    text={boilerplates.long}
                  />
                </CardContent>
              </Card>
            </section>

            {/* Press Releases - NEW */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Press Releases</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li>
                      <Link
                        href="/blog/pixel-launch-announcement"
                        className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-semibold text-lg">
                          Recreate Your Memories in 4K
                        </p>
                        <p className="text-sm text-muted-foreground">
                          December 15, 2025
                        </p>
                      </Link>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Usage Guidelines */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Usage Guidelines</CardTitle>
                  <CardDescription>
                    How to use our brand assets correctly
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
                          Use logos on a clean, uncluttered background
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        <span>
                          Maintain minimum clear space around the logo (equal to the height of the
                          icon)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        <span>
                          Use the appropriate color variant for the background
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        <span>Scale proportionally</span>
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
                        <span>Stretch, distort, or rotate the logo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>Change the logo colors or add effects</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>
                          Place the logo on busy or clashing backgrounds
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>Use the logo smaller than 24px height</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>Alter the spacing between logo elements</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-700">
                    <h4 className="font-semibold text-yellow-200 mb-2">
                      Trademark Notice
                    </h4>
                    <p className="text-sm text-yellow-300">
                      spike.land, the spike.land logo, and Pixel are trademarks of SPIKE LAND LTD.
                      Use of these trademarks must comply with these guidelines. For questions about
                      usage, contact hello@spike.land.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Company Name
                  </span>
                  <p className="font-semibold">SPIKE LAND LTD</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Company Number
                  </span>
                  <p className="font-semibold">16906682</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Registered
                  </span>
                  <p className="font-semibold">United Kingdom</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Founded</span>
                  <p className="font-semibold">2024</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Website</span>
                  <p className="font-semibold">
                    <a
                      href="https://spike.land"
                      className="text-primary hover:underline"
                    >
                      spike.land
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Founder - MODIFIED */}
            <Card>
              <CardHeader>
                <CardTitle>Founder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border">
                    <Image
                      src="https://pub-cf0adddb5752426a96ef090997e0da95.r2.dev/users/user_49d6efb916aec77949d6efb916aec779/enhanced/5ff8ba3c-7b23-4a1e-b9fd-14a7c3da15ab/cmj5mq0xv000304le96338hpb.jpg"
                      alt="Zoltan Erdos"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">Zoltan Erdos</p>
                    <p className="text-sm text-muted-foreground">
                      Founder & CEO
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Zoltan is a software engineer with a vision to democratize creation. Originally
                    from Hungary and now based in Brighton, UK, he pioneered vibe coding in 2019,
                    long before the AI wave.
                  </p>
                  <p>
                    He founded SPIKE LAND LTD in 2024 to bring professional-grade AI tools to
                    everyone. His dog Pixel serves as the Chief Morale Officer and supervisor of all
                    operations in Brighton.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Press Contact */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle>Press Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Email</span>
                  <p className="font-semibold">
                    <a
                      href="mailto:press@spike.land"
                      className="text-primary hover:underline"
                    >
                      press@spike.land
                    </a>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    General Inquiries
                  </span>
                  <p className="font-semibold">
                    <a
                      href="mailto:hello@spike.land"
                      className="text-primary hover:underline"
                    >
                      hello@spike.land
                    </a>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  For press inquiries, interviews, or additional assets, please contact our press
                  team. We typically respond within 24-48 hours.
                </p>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Follow Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href="https://x.com/ai_spike_land"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <Twitter className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">X (Twitter)</p>
                    <p className="text-sm text-muted-foreground">
                      @ai_spike_land
                    </p>
                  </div>
                </a>
                <a
                  href="https://linkedin.com/company/spike-land"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center">
                    <Linkedin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">LinkedIn</p>
                    <p className="text-sm text-muted-foreground">spike-land</p>
                  </div>
                </a>
                <a
                  href="https://github.com/zerdos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#24292e] flex items-center justify-center">
                    <Github className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">GitHub</p>
                    <p className="text-sm text-muted-foreground">zerdos</p>
                  </div>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
