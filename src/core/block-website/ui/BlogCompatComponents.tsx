// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  CheckCircle2,
  Gauge,
  Layers3,
  PlayCircle,
  RotateCcw,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { cn } from "@spike-land-ai/shared";
import { buttonVariants } from "../lazy-imports/button";
import { apiUrl } from "../core-logic/api";
import {
  getPersonaGroup,
  getPersonaSlug,
  type PersonaGroup,
} from "../core-logic/persona-content-variants";
import {
  PERSONAS,
  getPersonaBySlug,
  type OnboardingPersona,
} from "../../../edge-api/spike-land/core-logic/lib/persona-data";

const PERSONA_EVENT = "spike:persona-change";
const POLL_EVENT = "spike:blog-poll-change";
const PERSONA_STORAGE_KEY = "spike_persona";

type PollOptionId = "yes" | "depends" | "no";

interface PollOption {
  copy: string;
  id: PollOptionId;
  tone: string;
}

const POLL_OPTIONS: PollOption[] = [
  { id: "yes", copy: "Yes, adaptive wins", tone: "bg-emerald-500/12 text-emerald-300" },
  { id: "depends", copy: "Only with transparency", tone: "bg-amber-500/12 text-amber-300" },
  { id: "no", copy: "No, keep it simpler", tone: "bg-rose-500/12 text-rose-300" },
];

const POLL_QUESTIONS: Record<PersonaGroup, string> = {
  technical: "Would you rather ship 16 persona variants than run classic 2-variant A/B tests?",
  founder: "If the infra is trustworthy, would you let your site adapt messaging by persona?",
  leader: "Is multi-persona personalization worth the operational complexity for a team?",
  creative:
    "Would you prefer a site that adapts itself to you instead of looking the same for everyone?",
};

const POLL_BASELINES: Record<PersonaGroup, Record<PollOptionId, number>> = {
  technical: { yes: 46, depends: 19, no: 8 },
  founder: { yes: 33, depends: 25, no: 11 },
  leader: { yes: 29, depends: 27, no: 14 },
  creative: { yes: 38, depends: 21, no: 9 },
};

const PERSONA_GROUP_LABELS: Record<PersonaGroup, string> = {
  technical: "Developers",
  founder: "Founders",
  leader: "Operators",
  creative: "Creators",
};

const PERSONA_SELECT_GROUPS: Array<{ label: string; personas: OnboardingPersona[] }> = [
  { label: "Developers", personas: PERSONAS.slice(0, 8) },
  { label: "Business", personas: PERSONAS.slice(8, 12) },
  { label: "Creators & Explorers", personas: PERSONAS.slice(12) },
];

function readStoredValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore persistence failures. The UI still works in-memory.
  }
}

function dispatchWindowEvent(name: string, detail: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function persistPersona(slug: string) {
  writeStoredValue(PERSONA_STORAGE_KEY, slug);
  if (typeof document !== "undefined") {
    document.cookie = `spike-persona=${slug}; path=/; max-age=31536000; SameSite=Lax`;
  }
  dispatchWindowEvent(PERSONA_EVENT, { slug });
}

function useActivePersona() {
  const [slug, setSlug] = useState(() => getPersonaSlug());

  useEffect(() => {
    const updatePersona = (event?: Event) => {
      const nextSlug =
        event instanceof CustomEvent && typeof event.detail?.slug === "string"
          ? (event.detail.slug as string)
          : getPersonaSlug();
      setSlug(nextSlug);
    };

    window.addEventListener(PERSONA_EVENT, updatePersona);
    window.addEventListener("storage", updatePersona);

    return () => {
      window.removeEventListener(PERSONA_EVENT, updatePersona);
      window.removeEventListener("storage", updatePersona);
    };
  }, []);

  const persona = useMemo(
    () => getPersonaBySlug(slug) ?? getPersonaBySlug("solo-explorer") ?? PERSONAS[0],
    [slug],
  );

  return {
    persona,
    setPersona: (nextSlug: string) => {
      setSlug(nextSlug);
      persistPersona(nextSlug);
    },
  };
}

function getPollStorageKey(slug: string) {
  return `spike.blog.poll.${slug}`;
}

function readPollVote(slug: string): PollOptionId | null {
  const stored = readStoredValue(getPollStorageKey(slug));
  return stored === "yes" || stored === "depends" || stored === "no" ? stored : null;
}

function writePollVote(slug: string, vote: PollOptionId) {
  writeStoredValue(getPollStorageKey(slug), vote);
  dispatchWindowEvent(POLL_EVENT, { slug, vote });
}

function buildPollCounts(group: PersonaGroup, vote: PollOptionId | null) {
  const baseline = POLL_BASELINES[group];
  return POLL_OPTIONS.map((option) => ({
    ...option,
    count: baseline[option.id] + (vote === option.id ? 1 : 0),
  }));
}

function buildAnalyticsRows(activeGroup: PersonaGroup, vote: PollOptionId | null) {
  return (Object.keys(POLL_BASELINES) as PersonaGroup[]).map((group) => {
    const counts = buildPollCounts(group, group === activeGroup ? vote : null);
    const total = counts.reduce((sum, option) => sum + option.count, 0);
    const leader =
      counts.reduce(
        (currentLeader, option) => (option.count > currentLeader.count ? option : currentLeader),
        counts[0] ?? { count: 0, copy: "", id: "yes", tone: "" },
      ) ?? counts[0];

    return {
      group,
      label: PERSONA_GROUP_LABELS[group],
      leader,
      options: counts.map((option) => ({
        ...option,
        percentage: total === 0 ? 0 : Math.round((option.count / total) * 100),
      })),
      total,
    };
  });
}

export function ToolCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(apiUrl("/store/tools"))
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { total?: number } | null) => {
        if (!cancelled && typeof data?.total === "number") {
          setCount(data.total);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span className="inline-flex min-w-[2.75rem] items-center justify-center rounded-full border border-primary/18 bg-primary/8 px-2 py-0.5 text-[0.82em] font-black text-primary align-middle">
      {count ?? "80+"}
    </span>
  );
}

export function CTAButton({ children, href }: { children?: React.ReactNode; href: string }) {
  return (
    <div className="not-prose my-10">
      <a
        href={href}
        className={cn(
          buttonVariants({ variant: "default" }),
          "inline-flex rounded-2xl px-6 py-6 text-sm font-black uppercase tracking-[0.18em] shadow-xl shadow-primary/15 transition-transform duration-200 hover:-translate-y-0.5",
        )}
      >
        <span>{children ?? "Continue"}</span>
        <ArrowRight className="ml-3 size-4" />
      </a>
    </div>
  );
}

export function AudioPlayer({ src, title }: { src: string; title?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, [rate]);

  return (
    <div className="not-prose my-12 rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-[var(--panel-shadow)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            <AudioLines className="size-3.5" />
            Companion Audio
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-foreground">
              {title ?? "Listen to this article"}
            </p>
            <p className="text-sm text-muted-foreground">
              Native audio track with independent playback controls.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[0.8, 1, 1.2, 1.5].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRate(preset)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-black tracking-[0.18em] uppercase transition-colors",
                preset === rate
                  ? "border-primary/30 bg-primary/12 text-primary"
                  : "border-border/60 bg-background/55 text-muted-foreground hover:text-foreground",
              )}
            >
              {preset}x
            </button>
          ))}
        </div>
      </div>

      <audio ref={audioRef} controls preload="metadata" className="mt-4 w-full" src={src}>
        Your browser does not support embedded audio playback.
      </audio>
    </div>
  );
}

export function AgentLoopDemo() {
  const steps = [
    {
      copy: "Claude Opus creates a fresh draft with the stable prompt prefix and live notes.",
      icon: Sparkles,
      label: "Generate",
    },
    {
      copy: "The transpiler acts as the environment. Broken imports and type errors surface immediately.",
      icon: Gauge,
      label: "Test",
    },
    {
      copy: "Claude Sonnet makes narrow repairs against the exact failure instead of regenerating blindly.",
      icon: RotateCcw,
      label: "Fix",
    },
    {
      copy: "Claude Haiku compresses the incident into a reusable learning note for the next run.",
      icon: Layers3,
      label: "Learn",
    },
  ] as const;

  return (
    <div className="not-prose my-12 rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-[var(--panel-shadow)] backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PlayCircle className="size-6" />
        </div>
        <div>
          <p className="text-lg font-black tracking-tight text-foreground">Agent Repair Loop</p>
          <p className="text-sm text-muted-foreground">
            A compressed view of the generate → test → fix → learn cycle.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className="relative rounded-[1.5rem] border border-border/55 bg-background/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-foreground">
                {step.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.copy}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PersonaLandingPreview() {
  const { persona } = useActivePersona();
  const group = getPersonaGroup(persona.slug);

  return (
    <div className="not-prose my-12 grid gap-4 rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-[var(--panel-shadow)] backdrop-blur-sm md:grid-cols-[1.25fr_0.9fr]">
      <div className="space-y-4 rounded-[1.6rem] border border-border/55 bg-background/65 p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
          <UserRoundSearch className="size-3.5" />
          {PERSONA_GROUP_LABELS[group]}
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tight text-foreground">{persona.name}</h3>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{persona.heroText}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {persona.recommendedAppSlugs.map((app) => (
            <span
              key={app}
              className="rounded-full border border-border/50 bg-card px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-foreground"
            >
              {app.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[1.6rem] border border-border/55 bg-primary/[0.045] p-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Active Landing Path
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This preview follows the same persona cookie the article components listen to, so
            switching personas updates the surrounding experience immediately.
          </p>
        </div>

        <a
          href={`/for/${persona.slug}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-5 rounded-2xl border-primary/20 bg-background/80 text-xs font-black uppercase tracking-[0.18em] text-foreground",
          )}
        >
          Open /for/{persona.slug}
          <ArrowRight className="ml-2 size-4" />
        </a>
      </div>
    </div>
  );
}

export function PersonaSwitcher() {
  const { persona, setPersona } = useActivePersona();

  return (
    <div className="not-prose my-12 rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-[var(--panel-shadow)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            <UserRoundSearch className="size-3.5" />
            Persona Switcher
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-foreground">
              Move the article into a different audience lens
            </p>
            <p className="text-sm text-muted-foreground">
              The poll, landing preview, and support framing update as soon as the persona changes.
            </p>
          </div>
        </div>

        <a
          href={`/for/${persona.slug}`}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "rounded-2xl text-xs font-black uppercase tracking-[0.18em] text-primary",
          )}
        >
          Current: {persona.name}
        </a>
      </div>

      <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
        Choose Persona
      </label>
      <select
        value={persona.slug}
        onChange={(event) => setPersona(event.target.value)}
        className="mt-2 h-13 w-full rounded-2xl border border-border/60 bg-background/75 px-4 text-sm font-semibold text-foreground outline-none transition-shadow focus:ring-2 focus:ring-primary/25"
      >
        {PERSONA_SELECT_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.personas.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.name} — {entry.description}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export function BlogPoll({ slug }: { slug: string }) {
  const { persona } = useActivePersona();
  const group = getPersonaGroup(persona.slug);
  const [vote, setVote] = useState<PollOptionId | null>(() => readPollVote(slug));

  const counts = useMemo(() => buildPollCounts(group, vote), [group, vote]);
  const totalVotes = counts.reduce((sum, option) => sum + option.count, 0);

  const submitVote = (nextVote: PollOptionId) => {
    setVote(nextVote);
    writePollVote(slug, nextVote);
  };

  return (
    <div className="not-prose my-12 rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-[var(--panel-shadow)] backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
          <Sparkles className="size-3.5" />
          Personalized Poll
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
          {persona.name}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-black tracking-tight text-foreground">
        {POLL_QUESTIONS[group]}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Your response is stored locally for this article preview and feeds the dashboard below.
      </p>

      <div className="mt-5 grid gap-3">
        {POLL_OPTIONS.map((option) => {
          const count = counts.find((entry) => entry.id === option.id)?.count ?? 0;
          const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => submitVote(option.id)}
              className={cn(
                "rounded-[1.4rem] border border-border/60 bg-background/60 px-4 py-4 text-left transition-all hover:border-primary/24 hover:bg-primary/[0.035]",
                vote === option.id && "border-primary/28 bg-primary/[0.06]",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.24em]",
                        option.tone,
                      )}
                    >
                      {option.copy}
                    </span>
                    {vote === option.id && <CheckCircle2 className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {count} responses · {percentage}%
                  </p>
                </div>
                <div className="h-2.5 w-28 overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PollAnalyticsDashboard({ slug }: { slug: string }) {
  const { persona } = useActivePersona();
  const group = getPersonaGroup(persona.slug);
  const [vote, setVote] = useState<PollOptionId | null>(() => readPollVote(slug));

  useEffect(() => {
    const updateVote = (event?: Event) => {
      const nextVote =
        event instanceof CustomEvent &&
        typeof event.detail?.slug === "string" &&
        event.detail.slug === slug &&
        typeof event.detail?.vote === "string"
          ? (event.detail.vote as PollOptionId)
          : readPollVote(slug);

      setVote(nextVote);
    };

    window.addEventListener(POLL_EVENT, updateVote);
    window.addEventListener(PERSONA_EVENT, updateVote);
    window.addEventListener("storage", updateVote);

    return () => {
      window.removeEventListener(POLL_EVENT, updateVote);
      window.removeEventListener(PERSONA_EVENT, updateVote);
      window.removeEventListener("storage", updateVote);
    };
  }, [slug]);

  const rows = useMemo(() => buildAnalyticsRows(group, vote), [group, vote]);

  return (
    <div className="not-prose my-12 rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-[var(--panel-shadow)] backdrop-blur-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            <BarChart3 className="size-3.5" />
            Persona Dashboard
          </div>
          <h3 className="mt-3 text-xl font-black tracking-tight text-foreground">
            How each audience cluster leans
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This snapshot combines seeded baseline data with your local vote so the article stays
            interactive even outside the legacy blog backend.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/65 px-4 py-3 text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Current Persona
          </p>
          <p className="mt-1 text-sm font-black text-foreground">{persona.name}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <div
            key={row.group}
            className="rounded-[1.5rem] border border-border/55 bg-background/60 p-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-foreground">
                  {row.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lead preference:{" "}
                  <span className="font-semibold text-foreground">{row.leader.copy}</span>
                </p>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                {row.total} total signals
              </p>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {row.options.map((option) => (
                <div key={option.id} className="rounded-2xl border border-border/50 bg-card/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.22em]",
                        option.tone,
                      )}
                    >
                      {option.id}
                    </span>
                    <span className="text-sm font-black text-foreground">{option.percentage}%</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground">
                    {option.copy}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
