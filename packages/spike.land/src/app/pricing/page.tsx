"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Rocket } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="container mx-auto pt-24 pb-12 px-4">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          Free to start. Built to scale.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Deploy apps, use MCP developer tools, and build with the platform -- all free. Paid plans
          coming soon for teams that need more.
        </p>
      </div>

      {/* What's Included */}
      <div className="max-w-2xl mx-auto mb-16">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <Rocket className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Everything you need to ship</h2>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>App deployment and hosting</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>
                  spike-cli MCP multiplexer with lazy toolset loading — agents see only the tools
                  they need
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>Real-time collaboration via WebSockets</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>App Store listing for your creations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>Community support and documentation</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center mb-16">
        <p className="text-muted-foreground mb-4">
          Need custom plans for your team or enterprise?
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild>
            <Link href="/waitlist">Get Started Free</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="mailto:hello@spike.land">Contact Us</Link>
          </Button>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">
                Why is spike.land free?
              </h3>
              <p className="text-muted-foreground">
                I quit my job to build spike.land full-time. I believe developer tools should be
                accessible to everyone. The free tier is not a trial -- it is the real product.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">
                Will there be paid plans?
              </h3>
              <p className="text-muted-foreground">
                Yes. Paid plans for teams and enterprises are coming soon, with features like custom
                domains, advanced analytics, and priority support. The core platform will always be
                free.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">
                How can I support the project?
              </h3>
              <p className="text-muted-foreground">
                Use it, tell someone about it, or contribute on GitHub. The project is open source
                and community contributions are welcome.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
