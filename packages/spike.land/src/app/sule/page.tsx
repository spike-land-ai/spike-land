"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Briefcase,
  Code2,
  ExternalLink,
  Github,
  Linkedin,
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

// Skill bar component
function SkillBar(
  { skill, level, color }: { skill: string; level: number; color: string; },
) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{skill}</span>
        <span className="text-sm text-muted-foreground">{level}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            color,
          )}
          style={{ width: animated ? `${level}%` : "0%" }}
        />
      </div>
    </div>
  );
}

// Timeline item
function TimelineItem({
  year,
  title,
  company,
  description,
  current,
}: {
  year: string;
  title: string;
  company: string;
  description: string;
  current?: boolean;
}) {
  return (
    <div className="relative pl-8 pb-8 border-l border-white/10 last:border-l-0 group">
      <div
        className={cn(
          "absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full border-2 transition-all duration-300",
          current
            ? "bg-aurora-green border-aurora-green shadow-glow-cyan"
            : "bg-background border-white/20 group-hover:border-aurora-teal",
        )}
      />
      <div className="text-xs text-aurora-teal font-mono mb-1">{year}</div>
      <h4 className="font-bold text-lg">{title}</h4>
      <div className="text-muted-foreground text-sm mb-2">{company}</div>
      <p className="text-sm text-muted-foreground/80">{description}</p>
    </div>
  );
}

export default function ArnoldSulePortfolio() {
  const typedText = useTypingEffect([
    "Full-Stack Developer",
    "System Architect",
    "Open Source Enthusiast",
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
      {/* Dynamic gradient background that follows mouse */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background:
            `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(34, 211, 238, 0.15), transparent 40%)`,
        }}
      />

      {/* Floating particles */}
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
          {/* Animated avatar ring */}
          <div className="relative inline-block mb-8">
            <div className="w-40 h-40 rounded-full bg-gradient-to-r from-aurora-green via-aurora-teal to-aurora-lime p-1 animate-spin-slow">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <span className="text-6xl font-black bg-gradient-to-r from-aurora-green to-aurora-teal bg-clip-text text-transparent">
                  AS
                </span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-aurora-green rounded-full p-2 shadow-glow-cyan">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-white via-aurora-teal to-aurora-green bg-clip-text text-transparent">
              Arnold Sule
            </span>
          </h1>

          <div className="h-8 mb-6">
            <span className="text-xl md:text-2xl text-muted-foreground font-mono">
              {typedText}
              <span className="animate-pulse">|</span>
            </span>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Crafting elegant solutions to complex problems. Passionate about building scalable
            systems, contributing to open source, and pushing the boundaries of what&apos;s possible
            with code.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
            <MapPin className="h-4 w-4" />
            <span>Budapest, Hungary</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="default" size="lg">
              <Mail className="h-5 w-5 mr-2" />
              Get In Touch
            </Button>
            <Button variant="outline" size="lg">
              <Github className="h-5 w-5 mr-2" />
              GitHub
            </Button>
            <Button variant="outline" size="lg">
              <Linkedin className="h-5 w-5 mr-2" />
              LinkedIn
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowRight className="h-6 w-6 rotate-90 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Terminal className="h-3 w-3 mr-1" /> About Me
              </Badge>
              <h2 className="text-4xl font-bold mb-6">
                Building the future,{" "}
                <span className="bg-gradient-to-r from-aurora-teal to-aurora-green bg-clip-text text-transparent">
                  one commit at a time
                </span>
              </h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                With over a decade of experience in software development, I&apos;ve had the
                privilege of working on systems that serve millions of users. From startups to
                enterprise, I bring a unique blend of technical expertise and creative
                problem-solving.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                When I&apos;m not coding, you&apos;ll find me exploring new technologies,
                contributing to open-source projects, or mentoring the next generation of
                developers.
              </p>
            </div>

            <Card variant="layers" className="p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-aurora-yellow" />
                Technical Skills
              </h3>
              <SkillBar
                skill="TypeScript / JavaScript"
                level={95}
                color="bg-aurora-teal"
              />
              <SkillBar
                skill="React / Next.js"
                level={92}
                color="bg-aurora-green"
              />
              <SkillBar
                skill="Node.js / Backend"
                level={88}
                color="bg-aurora-lime"
              />
              <SkillBar
                skill="Cloud Architecture (AWS/GCP)"
                level={85}
                color="bg-aurora-yellow"
              />
              <SkillBar
                skill="System Design"
                level={90}
                color="bg-gradient-to-r from-aurora-teal to-aurora-green"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-aurora-teal/5 to-transparent">
        <div className="max-w-6xl mx-auto">
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

          <div className="max-w-2xl mx-auto">
            <TimelineItem
              year="2021 - Present"
              title="Senior Software Architect"
              company="Tech Innovation Labs"
              description="Leading architecture decisions for a platform serving 2M+ daily active users. Spearheading the migration to microservices and implementing event-driven architecture."
              current
            />
            <TimelineItem
              year="2018 - 2021"
              title="Full-Stack Tech Lead"
              company="Digital Solutions Inc."
              description="Led a team of 8 engineers building fintech applications. Reduced system latency by 60% through optimization and caching strategies."
            />
            <TimelineItem
              year="2015 - 2018"
              title="Software Engineer"
              company="StartupXYZ"
              description="Built core features for a B2B SaaS platform from the ground up. Implemented real-time collaboration features used by 50k+ businesses."
            />
            <TimelineItem
              year="2012 - 2015"
              title="Junior Developer"
              company="Web Agency Pro"
              description="Started my journey building responsive websites and web applications. Learned the fundamentals of software craftsmanship."
            />
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProjectCard
              title="CloudSync Pro"
              description="Real-time file synchronization platform with conflict resolution and offline support."
              tags={["TypeScript", "Go", "PostgreSQL", "Redis"]}
              gradient="bg-gradient-to-r from-aurora-teal to-aurora-green"
            />
            <ProjectCard
              title="DevFlow"
              description="Open-source CI/CD pipeline builder with visual workflow editor and GitHub integration."
              tags={["React", "Node.js", "Docker", "K8s"]}
              link="https://github.com"
              gradient="bg-gradient-to-r from-aurora-green to-aurora-lime"
            />
            <ProjectCard
              title="MetricsDash"
              description="Real-time analytics dashboard with customizable widgets and alerting system."
              tags={["Next.js", "ClickHouse", "WebSocket"]}
              gradient="bg-gradient-to-r from-aurora-lime to-aurora-yellow"
            />
            <ProjectCard
              title="CodeMentor AI"
              description="AI-powered code review assistant that provides contextual feedback and suggestions."
              tags={["Python", "LLM", "FastAPI", "React"]}
              gradient="bg-gradient-to-r from-aurora-yellow to-aurora-teal"
            />
            <ProjectCard
              title="InfraCLI"
              description="Command-line tool for managing cloud infrastructure across multiple providers."
              tags={["Rust", "AWS", "GCP", "Azure"]}
              link="https://github.com"
              gradient="bg-gradient-to-r from-aurora-teal to-blue-500"
            />
            <ProjectCard
              title="TeamHub"
              description="Team collaboration platform with async video, shared docs, and project tracking."
              tags={["TypeScript", "PostgreSQL", "WebRTC"]}
              gradient="bg-gradient-to-r from-blue-500 to-aurora-green"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card variant="highlighted" className="p-12">
            <h2 className="text-4xl font-bold mb-4">
              Let&apos;s{" "}
              <span className="bg-gradient-to-r from-aurora-teal to-aurora-green bg-clip-text text-transparent">
                Build Something
              </span>{" "}
              Together
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              I&apos;m always open to discussing new projects, creative ideas, or opportunities to
              be part of your vision. Drop me a line and let&apos;s create something amazing.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="default" size="lg">
                <Mail className="h-5 w-5 mr-2" />
                arnold.sule@email.com
              </Button>
              <Button variant="aurora" size="lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Download Resume
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Arnold Sule. Built with passion and lots of coffee.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com"
              className="text-muted-foreground hover:text-aurora-teal transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com"
              className="text-muted-foreground hover:text-aurora-teal transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="mailto:contact@example.com"
              className="text-muted-foreground hover:text-aurora-teal transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
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
