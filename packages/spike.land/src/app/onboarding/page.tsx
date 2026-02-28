"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WaitlistInlineForm } from "@/components/waitlist/WaitlistInlineForm";
import { STORE_APPS } from "@/app/store/data/store-apps";
import { setPersonaCookieClient } from "@/lib/onboarding/get-persona-cookie";
import { derivePersonaSlugFromTags } from "@/lib/onboarding/personas";
import { ArrowRight, SkipForward, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { getPersonaBySlug } from "@/lib/onboarding/personas";

interface RephrasedQuestion {
  headline: string;
  subtext?: string;
  yesLabel: string;
  noLabel: string;
}

interface AvlSessionState {
  sessionId: string;
  status: string;
  question?: string;
  questionTags?: string[];
  round?: number;
  rephrased?: RephrasedQuestion;
  profile?: {
    derivedTags: string[];
    leafNodeId: string;
    answerPath: { question: string; answer: boolean; }[];
  };
}

// Map derivedTags to nearest persona name
function derivePersonaName(tags: string[]): string {
  if (tags.includes("developer") && tags.includes("ai-agents")) {
    return "AI Builder";
  }
  if (tags.includes("developer")) return "Code Creator";
  if (tags.includes("marketing") || tags.includes("social")) {
    return "Growth Hacker";
  }
  if (tags.includes("creative") && tags.includes("audio")) {
    return "Sound Designer";
  }
  if (tags.includes("creative")) return "Visual Creator";
  if (tags.includes("mobile")) return "Mobile Pioneer";
  if (tags.includes("collaboration") || tags.includes("enterprise")) {
    return "Team Leader";
  }
  return "Explorer";
}

function derivePersonaHero(name: string): string {
  const heroes: Record<string, string> = {
    "AI Builder": "You thrive at the intersection of code and intelligence.",
    "Code Creator": "You build things that work — and make them better.",
    "Growth Hacker": "You turn audiences into communities.",
    "Sound Designer": "You shape the soundscapes that move people.",
    "Visual Creator": "You see the world in frames and pixels.",
    "Mobile Pioneer": "You live life on the go — and your tools should too.",
    "Team Leader": "You bring people together to ship great work.",
    Explorer: "You're curious about everything — and that's your superpower.",
  };
  return heroes[name] ?? heroes.Explorer!;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AvlSessionState | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch initial session
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/avl/session");
        const data = (await res.json()) as AvlSessionState;

        // Redirect if they have already answered all questions
        if (data.status === "ASSIGNED" || data.status === "ALREADY_PROFILED") {
          router.replace("/");
          return;
        }

        setSession(data);
        if (data.profile?.answerPath) {
          setAnsweredCount(data.profile.answerPath.length);
        }
        // Check auth status
        const authRes = await fetch("/api/auth/session");
        const authData = (await authRes.json()) as {
          user?: { id: string; };
        };
        setIsAuthenticated(!!authData?.user);
      } catch {
        // Fallback: show skip option
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const handleAnswer = useCallback(
    async (answer: boolean) => {
      if (!session?.sessionId) return;

      try {
        const res = await fetch("/api/avl/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.sessionId, answer }),
        });
        const data = (await res.json()) as AvlSessionState;
        setSession(data);
        setAnsweredCount(c => c + 1);

        // Set persona cookie client-side as backup and apply default theme
        if (
          (data.status === "ASSIGNED" || data.status === "ALREADY_PROFILED")
          && data.profile?.derivedTags
        ) {
          const slug = derivePersonaSlugFromTags(data.profile.derivedTags);
          if (slug) {
            setPersonaCookieClient(slug);
            const persona = getPersonaBySlug(slug);
            if (persona) {
              setTheme(persona.defaultTheme);
              localStorage.setItem("selected-theme", persona.defaultTheme);
            }
          }
        }
      } catch {
        // Silent fail
      }
    },
    [session?.sessionId, setTheme],
  );

  const handleSkip = useCallback(() => {
    document.cookie = "spike-onboarded=1; path=/; max-age=31536000; samesite=lax";
    startTransition(() => {
      router.push("/");
    });
  }, [router]);

  const handleContinue = useCallback(() => {
    startTransition(() => {
      router.push("/store");
    });
  }, [router]);

  const isComplete = session?.status === "ASSIGNED"
    || session?.status === "ALREADY_PROFILED";
  const hasQuestion = session?.status === "QUESTION";
  const round = session?.round ?? 0;
  const progress = isComplete ? 100 : Math.min((answeredCount / 7) * 100, 95);

  const personaName = isComplete && session?.profile
    ? derivePersonaName(session.profile.derivedTags)
    : null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-zinc-950 to-fuchsia-950/20" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8 px-4">
        {/* Progress bar */}
        <div className="w-full max-w-md">
          <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
            <span>
              {isComplete
                ? "Complete"
                : round > 0
                ? `Round ${round + 1}`
                : `Step ${answeredCount + 1}`}
            </span>
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 text-zinc-500 transition-colors hover:text-zinc-300"
              disabled={isPending}
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </button>
          </div>
          <Progress value={progress} glow />
        </div>

        {/* Question card */}
        {hasQuestion && session?.rephrased && (
          <Card className="w-full border-white/10">
            <CardContent className="flex flex-col items-center gap-8 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
                <Sparkles className="h-6 w-6 text-cyan-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {session.rephrased.headline}
                </h1>
                {session.rephrased.subtext && (
                  <p className="mt-2 text-sm text-zinc-400">
                    {session.rephrased.subtext}
                  </p>
                )}
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
                <Button
                  size="lg"
                  variant="default"
                  className="flex-1 py-6 text-base"
                  onClick={() => handleAnswer(true)}
                >
                  {session.rephrased.yesLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 py-6 text-base"
                  onClick={() => handleAnswer(false)}
                >
                  {session.rephrased.noLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion card */}
        {isComplete && personaName && (
          <Card className="w-full border-white/10">
            <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20">
                <Sparkles className="h-8 w-8 text-cyan-400" />
              </div>

              <div>
                <p className="mb-1 text-sm font-medium uppercase tracking-wider text-cyan-400">
                  You are a
                </p>
                <h1 className="text-3xl font-bold text-white sm:text-4xl">
                  {personaName}
                </h1>
              </div>

              <p className="max-w-md text-lg text-zinc-300">
                {derivePersonaHero(personaName)}
              </p>

              {/* Recommended apps based on tags */}
              {session?.profile && (
                <div className="w-full">
                  <p className="mb-3 text-sm font-medium text-zinc-400">
                    Recommended for you
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {STORE_APPS.filter(app =>
                      session.profile!.derivedTags.some(
                        tag =>
                          app.category.toLowerCase().includes(tag)
                          || app.name.toLowerCase().includes(tag),
                      )
                    )
                      .slice(0, 4)
                      .map(app => (
                        <div
                          key={app.id}
                          className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:border-white/10 hover:bg-white/10"
                        >
                          <span className="text-sm font-medium text-white">
                            {app.name}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {app.category}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex w-full flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
                <Button
                  size="lg"
                  variant="default"
                  className="flex-1 py-6 text-base"
                  onClick={handleContinue}
                  disabled={isPending}
                  loading={isPending}
                >
                  Explore Apps
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Waitlist form for unauthenticated users */}
              {!isAuthenticated && (
                <div className="w-full border-t border-white/10 pt-4">
                  <p className="mb-3 text-sm font-medium text-zinc-400">
                    Save your profile
                  </p>
                  <WaitlistInlineForm
                    source="onboarding"
                    className="mx-auto max-w-sm"
                  />
                </div>
              )}

              <button
                onClick={handleSkip}
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                disabled={isPending}
              >
                Go to homepage
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
