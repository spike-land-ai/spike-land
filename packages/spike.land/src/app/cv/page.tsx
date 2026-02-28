"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Code2,
  ExternalLink,
  Github,
  LayoutDashboard,
  Linkedin,
  type LucideIcon,
  Mail,
  MapPin,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

// Floating particle component
function FloatingParticle(
  { delay, duration }: { delay: number; duration: number; },
) {
  return (
    <div
      className="absolute w-1 h-1 rounded-full bg-aurora-teal/40 animate-float"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Typing animation hook
function useTypingEffect(
  texts: string[],
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseTime = 2000,
) {
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex] ?? "";

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (displayText.length < currentText.length) {
            setDisplayText(currentText.slice(0, displayText.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), pauseTime);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText(displayText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setTextIndex(prev => (prev + 1) % texts.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed,
    );

    return () => clearTimeout(timeout);
  }, [
    displayText,
    isDeleting,
    textIndex,
    texts,
    typingSpeed,
    deletingSpeed,
    pauseTime,
  ]);

  return displayText;
}

// Project card component
function ProjectCard({
  title,
  description,
  tags,
  link,
  gradient,
}: {
  title: string;
  description: string;
  tags: string[];
  link?: string;
  gradient: string;
}) {
  return (
    <Card
      variant="magic"
      className="group hover:scale-[1.02] transition-all duration-500 overflow-hidden"
    >
      <div className={cn("h-2 w-full", gradient)} />
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          {title}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-5 w-5 text-aurora-teal" />
            </a>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Metric card component
function MetricCard({
  label,
  value,
  icon: Icon,
  delay,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delay: number;
}) {
  return (
    <Card
      className="bg-white/5 border-white/10 hover:border-aurora-teal/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards opacity-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className="mb-3 p-3 rounded-full bg-aurora-teal/10 text-aurora-teal">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-3xl font-black mb-1 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          {value}
        </h3>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// Timeline item
function TimelineItem({
  period,
  title,
  company,
  description,
  current,
  achievements,
}: {
  period: string;
  title: string;
  company: string;
  description?: string;
  current?: boolean;
  achievements: string[];
}) {
  return (
    <div className="relative pl-8 pb-12 border-l border-white/10 last:border-l-0 group">
      <div
        className={cn(
          "absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full border-2 transition-all duration-300",
          current
            ? "bg-aurora-green border-aurora-green shadow-glow-cyan"
            : "bg-background border-white/20 group-hover:border-aurora-teal",
        )}
      />
      <div className="text-xs text-aurora-teal font-mono mb-1">{period}</div>
      <h4 className="font-bold text-lg">{title}</h4>
      <div className="text-muted-foreground text-sm mb-4">{company}</div>
      {description && <p className="text-sm text-muted-foreground/80 mb-2">{description}</p>}
      <ul className="space-y-2">
        {achievements.map((item, i) => (
          <li
            key={i}
            className="text-sm text-muted-foreground flex items-start"
          >
            <span className="mr-2 mt-1.5 w-1 h-1 rounded-full bg-aurora-teal/50" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const skills = {
  frontend: ["TypeScript", "React", "Next.js 15", "Angular", "Tailwind CSS"],
  backend: ["Node.js", "Deno", ".NET Core", "PostgreSQL", "MSSQL", "Prisma"],
  devops: ["Docker", "Kubernetes", "AWS", "GCP", "Azure", "Cloudflare Workers"],
  testing: ["Vitest", "Playwright", "Cucumber", "TDD", "100% Coverage"],
  ai: [
    "Claude Opus 4.6",
    "MCP Servers",
    "Context Engineering",
    "Coding Agents",
  ],
};

const experience = [
  {
    period: "2023 - 2026",
    role: "Frontend Developer",
    company: "Virgin Media O2 Limited",
    type: "Contractor",
    achievements: [
      "Delivered 10 critical user journeys on the My O2 mobile platform",
      "Reduced CSS build size by 80% via PostCSS plugins",
      "Built automated Figma-to-PR pipeline for the Component Library",
      "Key role in cloud migration of virginmediao2.co.uk",
      "Pioneering AI-assisted development with Claude Code and context engineering",
      "Driving 50x productivity gains through AI-powered workflows",
    ],
  },
  {
    period: "2018 - 2023",
    role: "Full Stack Developer",
    company: "Investec Bank",
    type: "Long-term Contractor",
    achievements: [
      "Established test automation and cloud deployment for Investec IX",
      "Developed Azure functions for data migration",
      "Full-stack development in Agile team environment",
      "Kept tech stack current and introduced new testing tools",
    ],
  },
  {
    period: "2014 - 2018",
    role: "Lead Frontend Developer",
    company: "TalkTalk",
    type: "Employee",
    achievements: [
      "Delivered new sales site and MyTalkTalk app",
      "Introduced TDD and Continuous Integration practices to teams",
      "Maintained technical vision and introduced new technologies",
      "Recruited and coached new talents, organized Lunch and Learn sessions",
    ],
  },
  {
    period: "2013 - 2014",
    role: "Senior Frontend Developer",
    company: "Keytree",
    type: "Employee",
    achievements: [
      "Consulted for BP, Jaguar Land Rover, and National Grid",
      "Created Angular frontends for legacy SAP applications",
    ],
  },
  {
    period: "2012 - 2013",
    role: "Frontend Developer",
    company: "Emarsys Ltd",
    type: "Employee",
    achievements: [
      "Learned agile philosophy, clean code, and TDD",
      "Part of fast-moving agile development team",
    ],
  },
];

const blogPosts = [
  { title: "My PRs Were Pure AI Slop: A Developer's Confession", file: "01" },
  {
    title: "I'm More Productive Than Ever and It's Ruining My Career",
    file: "02",
  },
  { title: "The Last Two Days of Every Sprint: A Horror Story", file: "03" },
  { title: "2025: The Year Coding Agents Outperformed Developers", file: "04" },
  { title: "The Trust Gap: Why Teams Reject AI-Generated Code", file: "05" },
  { title: "Quality, Speed, Price: The Triangle AI Just Broke", file: "06" },
  { title: "Context Engineering: The Skill That Replaced Coding", file: "07" },
  { title: "How to Not Produce AI Slop: A Framework", file: "08" },
  { title: "The New Developer Onboarding: AI Edition", file: "09" },
  { title: "What Do Developers Become?", file: "10" },
  { title: "The Requirement Is the Product", file: "11" },
  {
    title: "Earning Less Than Five Years Ago: The Developer's Economic Reality",
    file: "12",
  },
  {
    title: "Brighton, Dogs, and ADHD: Building a Startup While Everything Burns",
    file: "13",
  },
  { title: "Why I Still Code When AI Does It Better", file: "14" },
  { title: "A Letter to the Junior Developer of 2026", file: "15" },
];

export default function CSPage() {
  const typedText = useTypingEffect([
    "Full-Stack Developer",
    "AI Pioneer",
    "System Architect",
    "Problem Solver",
  ]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background:
            `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 229, 255, 0.1), transparent 40%)`,
        }}
      />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.5}
            duration={10 + Math.random() * 10}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-aurora-teal/5 via-transparent to-transparent" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="relative inline-block mb-8">
            <div className="w-40 h-40 rounded-full bg-gradient-to-r from-aurora-green via-aurora-teal to-aurora-lime p-1 animate-spin-slow">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <span className="text-6xl font-black bg-gradient-to-r from-aurora-green to-aurora-teal bg-clip-text text-transparent">
                  ZE
                </span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-aurora-green rounded-full p-2 shadow-glow-cyan">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-white via-aurora-teal to-aurora-green bg-clip-text text-transparent">
              Zoltan Erdos
            </span>
          </h1>

          <div className="h-8 mb-6">
            <span className="text-xl md:text-2xl text-muted-foreground font-mono">
              {typedText}
              <span className="animate-pulse">|</span>
            </span>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Full Stack Developer with 12+ years experience. Founder of Spike Land. Expert in
            TypeScript, React, Next.js, and AI-driven development.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
            <MapPin className="h-4 w-4" />
            <span>Brighton, UK</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="default" size="lg" asChild>
              <a href="mailto:zoltan.erdos@me.com">
                <Mail className="h-5 w-5 mr-2" />
                Get In Touch
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://github.com/zerdos"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-5 w-5 mr-2" />
                LinkedIn
              </a>
            </Button>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowRight className="h-6 w-6 rotate-90 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-12 px-4 relative z-10 -mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              label="Years Experience"
              value="12+"
              icon={Briefcase}
              delay={0}
            />
            <MetricCard label="Packages" value="5" icon={Code2} delay={100} />
            <MetricCard
              label="DB Models"
              value="54"
              icon={LayoutDashboard}
              delay={200}
            />
            <MetricCard
              label="API Endpoints"
              value="100+"
              icon={Zap}
              delay={300}
            />
            <MetricCard
              label="Test Coverage"
              value="100%"
              icon={Terminal}
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-2">
                <Terminal className="h-3 w-3 mr-1" /> About Me
              </Badge>
              <h2 className="text-4xl font-bold">
                Building the future,{" "}
                <span className="bg-gradient-to-r from-aurora-teal to-aurora-green bg-clip-text text-transparent">
                  with AI
                </span>
              </h2>
              <div className="prose prose-invert text-muted-foreground">
                <p>
                  Passionate Full Stack Developer with 12+ years of experience and a strong focus on
                  frontend development backed by substantial backend expertise. I believe in
                  Test-Driven Development, clean code, and staying current with the latest tech.
                </p>
                <p>
                  In 2025, I discovered something that changed everything: with AI tools like Claude
                  Code and Opus 4.6, developers can be 50x more productive. But only if they
                  understand context engineering.
                </p>
                <blockquote className="border-l-4 border-aurora-teal pl-4 italic text-white/80 my-4">
                  "With AI, the impossible triangle is broken. High quality, fast delivery, AND low
                  cost are now achievable together."
                </blockquote>
              </div>
            </div>

            <Card variant="layers" className="p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-aurora-yellow" />
                Technical Skills
              </h3>
              <div className="space-y-6">
                {(Object.entries(skills) as [string, string[]][]).map((
                  [category, items],
                ) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3 text-xs tracking-wider">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map(skill => (
                        <Badge
                          key={skill}
                          variant={category === "ai" ? "default" : "secondary"}
                          className={cn(
                            category === "ai"
                              && "bg-aurora-teal hover:bg-aurora-teal/80",
                          )}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-aurora-teal/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Briefcase className="h-3 w-3 mr-1" /> Experience
            </Badge>
            <h2 className="text-4xl font-bold">
              Professional{" "}
              <span className="bg-gradient-to-r from-aurora-teal to-aurora-green bg-clip-text text-transparent">
                Journey
              </span>
            </h2>
          </div>

          <div>
            {experience.map((job, index) => (
              <TimelineItem
                key={index}
                period={job.period}
                title={job.role}
                company={job.company}
                description={job.type}
                achievements={job.achievements}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Code2 className="h-3 w-3 mr-1" /> Projects
            </Badge>
            <h2 className="text-4xl font-bold">
              Featured{" "}
              <span className="bg-gradient-to-r from-aurora-teal to-aurora-green bg-clip-text text-transparent">
                Work
              </span>
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <ProjectCard
              title="Spike Land"
              description="Open-source, AI-powered development platform. Send a message and a Cloud Run devcontainer spins up with your code and dependencies. Claude Code makes changes that appear instantly via hot reload. On your final message, it builds, deploys, and the container shuts down. Recursive agent workflows, 100% test coverage, fast CI. The source code is on GitHub — clone it, run it locally, see what AI-assisted development looks like in practice."
              tags={[
                "Next.js 15",
                "Cloudflare Workers",
                "Cloud Run",
                "Claude Code",
                "Context Engineering",
              ]}
              link="/"
              gradient="bg-gradient-to-r from-aurora-teal to-aurora-green"
            />
          </div>
        </div>
      </section>

      {/* Thoughts Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="h-3 w-3 mr-1" /> Writing
            </Badge>
            <h2 className="text-4xl font-bold">
              Recent{" "}
              <span className="bg-gradient-to-r from-aurora-teal to-aurora-green bg-clip-text text-transparent">
                Insights
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogPosts.map((post, i) => (
              <Card
                key={i}
                className="group hover:border-aurora-teal/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="text-xs text-aurora-teal font-mono mb-2">
                    {post.file}
                  </div>
                  <h3 className="font-bold group-hover:text-aurora-teal transition-colors">
                    {post.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Zoltan Erdos. Built with AI & Passion.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/zerdos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-aurora-teal transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-aurora-teal transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="mailto:zoltan.erdos@me.com"
              className="text-muted-foreground hover:text-aurora-teal transition-colors"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>

      <style jsx global>
        {`
        @keyframes float {
          0%,
          100% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(90vh) scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-10vh) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}
      </style>
    </div>
  );
}
