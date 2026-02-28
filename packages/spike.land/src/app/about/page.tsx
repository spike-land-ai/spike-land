import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, Rocket } from "lucide-react";
import toolsManifest from "@/lib/docs/generated/tools-manifest.json";

const toolCount = toolsManifest.tools.length;

export const metadata: Metadata = {
  title: "About spike.land — Open-Source MCP Multiplexer Platform",
  description:
    `spike.land is an open-source MCP multiplexer platform by Zoltan Erdos. spike-cli lazy-loads tool definitions — AI agents see only the tools they need. ${toolCount}+ MCP tools, fast CI, and engineering discipline.`,
  openGraph: {
    title: "About spike.land — Open-Source AI Development Platform",
    description:
      "An open-source, AI-powered development platform removing the friction between idea and shipped software.",
    type: "website",
    url: "https://spike.land/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About spike.land — Open-Source AI Development Platform",
    description:
      "An open-source, AI-powered development platform removing the friction between idea and shipped software.",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto pt-24 pb-12 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-foreground/80">
            About Spike Land
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            An open-source, AI-powered development platform — removing the friction between idea and
            shipped software.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-12">
          <Card className="bg-card/50 backdrop-blur-sm border-muted">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Rocket className="w-6 h-6 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="text-lg leading-relaxed text-muted-foreground">
              <p>
                The bottleneck in modern software development is not writing code. It is everything
                around the code — blocked PRs, week-long review cycles, the fear of refactoring, the
                meetings about meetings. Spike Land exists to make that friction unnecessary. By
                combining AI agents, fast CI pipelines, and engineering discipline, we enable
                developers to ship production-grade software faster than ever — without sacrificing
                quality. The entire platform is{" "}
                <a
                  href="https://github.com/spike-land-ai/spike.land"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  open source on GitHub
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Founder Story */}
        <section className="mb-12">
          <Card className="bg-card/50 backdrop-blur-sm border-muted">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary" />
                The Founder&apos;s Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Spike Land is the work of Zoltan Erdos, a full-stack developer with 12+ years of
                experience building software for companies like Investec Bank, TalkTalk, and Virgin
                Media O2. Based in Brighton, UK, the project grew from a simple observation: AI can
                write code faster than any human — but only if the engineering foundations are
                right. Fast CI, 100% test coverage, strict types, clean architecture. Without those,
                you are just automating chaos.
              </p>
              <p>
                After years of watching enterprise teams cling to manual reviews, manual testing,
                and manual deployment ceremonies — paying more to move slower — the mission became
                clear: build a platform that proves a single developer with the right tools and
                discipline can outship entire teams. Not by working harder, but by removing the
                friction that makes software development slow. SPIKE LAND LTD is a UK company (No.
                16906682).
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Engineering Discipline",
                description:
                  "100% test coverage, strict TypeScript, fast CI. The foundation is not the AI — it is the engineering discipline that makes AI a force multiplier.",
              },
              {
                title: "Open Source",
                description:
                  "The entire platform is open source. Clone it, run it locally, contribute. Transparency is not a value statement — it is the codebase on GitHub.",
              },
              {
                title: "Human on the Loop",
                description:
                  "AI does the exploration and execution. Humans design the system, review the plans, and make the decisions that require business context.",
              },
            ].map((value, index) => (
              <Card
                key={index}
                className="bg-card/30 border-muted hover:bg-card/50 transition-colors"
              >
                <CardHeader>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section>
          <h2 className="text-3xl font-bold mb-10 text-center">
            Journey & Experience
          </h2>
          <div className="relative border-l-2 border-primary/20 ml-4 md:ml-12 space-y-12">
            {/* Item 1: Spike Land */}
            <div className="relative pl-8 md:pl-12 group">
              <div className="absolute -left-[7px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background group-hover:ring-primary/20 transition-all">
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Spike Land
                </h3>
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full w-fit mt-2 sm:mt-0">
                  Present
                </span>
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Founder
              </p>
              <p className="text-muted-foreground/80">
                Building an open-source, AI-powered development platform. Recursive agent workflows,
                fast CI, 100% test coverage, and engineering discipline that makes autonomous coding
                agents safe and productive.
              </p>
            </div>

            {/* Item 2: Virgin Media O2 */}
            <div className="relative pl-8 md:pl-12 group">
              <div className="absolute -left-[7px] top-0 w-4 h-4 rounded-full bg-muted-foreground/40 ring-4 ring-background group-hover:bg-primary/60 transition-all">
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground">
                  Virgin Media O2
                </h3>
                <span className="text-sm text-muted-foreground">
                  2023 &ndash; 2026
                </span>
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Frontend Developer (Contractor)
              </p>
              <p className="text-muted-foreground/80">
                Delivered critical user journeys on the My O2 mobile platform. Pioneered AI-assisted
                development with Claude Code and context engineering. Reduced CSS build size by 80%
                via PostCSS plugins.
              </p>
            </div>

            {/* Item 3: Investec */}
            <div className="relative pl-8 md:pl-12 group">
              <div className="absolute -left-[7px] top-0 w-4 h-4 rounded-full bg-muted-foreground/40 ring-4 ring-background group-hover:bg-primary/60 transition-all">
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground">Investec</h3>
                <Building2 className="w-5 h-5 text-muted-foreground hidden sm:block" />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Fintech Innovation
              </p>
              <p className="text-muted-foreground/80">
                Worked within the demanding financial sector to deliver secure, reliable, and
                innovative digital banking and investment platforms.
              </p>
            </div>

            {/* Item 4: TalkTalk */}
            <div className="relative pl-8 md:pl-12 group">
              <div className="absolute -left-[7px] top-0 w-4 h-4 rounded-full bg-muted-foreground/40 ring-4 ring-background group-hover:bg-primary/60 transition-all">
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground">TalkTalk</h3>
                <Globe className="w-5 h-5 text-muted-foreground hidden sm:block" />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Telecommunications
              </p>
              <p className="text-muted-foreground/80">
                Developed critical infrastructure and service platforms for a major UK
                telecommunications provider, handling massive user scale and data throughput.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
