"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  Loader2,
  Plus,
  Sparkles,
  Star,
  Target,
  X,
} from "lucide-react";

export interface AssessedSkill {
  uri: string;
  title: string;
  proficiency: number; // 1-5
}

export interface OccupationMatch {
  uri: string;
  title: string;
  score: number;
  matchedSkills: number;
  totalRequired: number;
  gaps: Array<{
    skill: { title: string; };
    priority: "high" | "medium" | "low";
    gap: number;
  }>;
}

interface AssessmentWizardProps {
  onAssess: (skills: AssessedSkill[]) => Promise<OccupationMatch[]>;
  onSelectOccupation?: (uri: string, title: string) => void;
  isLoading?: boolean;
}

type WizardStep = "skills" | "proficiency" | "results";

const PROFICIENCY_LABELS = {
  1: { label: "Novice", desc: "I've heard of it", color: "text-zinc-500" },
  2: { label: "Beginner", desc: "Basic understanding", color: "text-blue-400" },
  3: {
    label: "Intermediate",
    desc: "Can work independently",
    color: "text-amber-400",
  },
  4: { label: "Advanced", desc: "Strong expertise", color: "text-green-400" },
  5: { label: "Expert", desc: "Deep mastery", color: "text-purple-400" },
} as const satisfies Record<
  1 | 2 | 3 | 4 | 5,
  { label: string; desc: string; color: string; }
>;

const SUGGESTED_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Python",
  "SQL",
  "Docker",
  "Kubernetes",
  "Git",
  "REST APIs",
  "GraphQL",
  "Node.js",
  "PostgreSQL",
  "AWS",
  "Machine Learning",
  "System Design",
];

type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

function clampProficiency(v: number): ProficiencyLevel {
  const clamped = Math.max(1, Math.min(5, Math.round(v)));
  return clamped as ProficiencyLevel;
}

function SkillProficiencySelector({
  skill,
  value,
  onChange,
}: {
  skill: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const safeLevel = clampProficiency(value);
  const levels: ProficiencyLevel[] = [1, 2, 3, 4, 5];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-200">{skill}</span>
        <span
          className={`text-xs font-semibold ${PROFICIENCY_LABELS[safeLevel].color}`}
        >
          {PROFICIENCY_LABELS[safeLevel].label}
        </span>
      </div>
      <div className="flex gap-1.5">
        {levels.map(level => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
              level <= value
                ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                : "border-zinc-700 bg-zinc-800/40 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400"
            }`}
            aria-label={`Set ${skill} proficiency to ${PROFICIENCY_LABELS[level].label}`}
          >
            {level}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-zinc-600">
        {PROFICIENCY_LABELS[safeLevel].desc}
      </p>
    </div>
  );
}

function ResultCard({
  match,
  onSelect,
}: {
  match: OccupationMatch;
  onSelect?: (uri: string, title: string) => void;
}) {
  const highGaps = match.gaps.filter(g => g.priority === "high");
  const medGaps = match.gaps.filter(g => g.priority === "medium");

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:border-amber-500/25 hover:bg-zinc-900/60 transition-all p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-100 group-hover:text-white">
            {match.title}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {match.matchedSkills} / {match.totalRequired} skills matched
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Star
            className={`w-4 h-4 ${match.score >= 70 ? "text-amber-400" : "text-zinc-600"}`}
          />
          <span
            className={`text-sm font-bold ${
              match.score >= 70 ? "text-amber-400" : "text-zinc-400"
            }`}
          >
            {match.score}%
          </span>
        </div>
      </div>

      {/* Score bar */}
      <Progress value={match.score} className="h-1.5 bg-zinc-800" />

      {/* Gaps */}
      {(highGaps.length > 0 || medGaps.length > 0) && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
            Key gaps
          </p>
          <div className="flex flex-wrap gap-1.5">
            {highGaps.slice(0, 3).map(g => (
              <Badge
                key={g.skill.title}
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-red-500/30 text-red-400"
              >
                {g.skill.title}
              </Badge>
            ))}
            {medGaps.slice(0, 2).map(g => (
              <Badge
                key={g.skill.title}
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400"
              >
                {g.skill.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {onSelect && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect(match.uri, match.title)}
          className="w-full gap-1 text-zinc-500 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/30 transition-colors"
        >
          View full details
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

export function AssessmentWizard({
  onAssess,
  onSelectOccupation,
  isLoading = false,
}: AssessmentWizardProps) {
  const [step, setStep] = useState<WizardStep>("skills");
  const [newSkill, setNewSkill] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [proficiencies, setProficiencies] = useState<Record<string, number>>(
    {},
  );
  const [results, setResults] = useState<OccupationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSkill = useCallback((skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || selectedSkills.includes(trimmed)) return;
    setSelectedSkills(prev => [...prev, trimmed]);
    setProficiencies(prev => ({ ...prev, [trimmed]: 3 }));
    setNewSkill("");
  }, [selectedSkills]);

  const removeSkill = useCallback((skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
    setProficiencies(prev => {
      const next = { ...prev };
      delete next[skill];
      return next;
    });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addSkill(newSkill);
  };

  const handleAssess = async () => {
    setLoading(true);
    setError(null);
    try {
      const skills: AssessedSkill[] = selectedSkills.map(title => ({
        uri: `user:${title.toLowerCase().replace(/\s+/g, "-")}`,
        title,
        proficiency: proficiencies[title] ?? 3,
      }));
      const matches = await onAssess(skills);
      setResults(matches);
      setStep("results");
    } catch {
      setError("Assessment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = { skills: 0, proficiency: 1, results: 2 }[step];
  const stepProgress = ((stepIndex + 1) / 3) * 100;

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Step {stepIndex + 1} of 3</span>
          <div className="flex items-center gap-3">
            {(["skills", "proficiency", "results"] as WizardStep[]).map((
              s,
              i,
            ) => (
              <div key={s} className="flex items-center gap-1">
                {i < stepIndex
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  : i === stepIndex
                  ? <Circle className="w-3.5 h-3.5 text-amber-400" />
                  : <Circle className="w-3.5 h-3.5 text-zinc-700" />}
                <span
                  className={i === stepIndex
                    ? "text-amber-400"
                    : i < stepIndex
                    ? "text-zinc-400"
                    : "text-zinc-600"}
                >
                  {s === "skills"
                    ? "Add Skills"
                    : s === "proficiency"
                    ? "Rate Skills"
                    : "Results"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Progress value={stepProgress} className="h-1 bg-zinc-800" />
      </div>

      {/* Step 1: Add skills */}
      {step === "skills" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              What skills do you have?
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Add skills you want to assess against occupations
            </p>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a skill name…"
              className="bg-zinc-900/60 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50"
            />
            <Button
              onClick={() => addSkill(newSkill)}
              disabled={!newSkill.trim()}
              className="bg-amber-600 hover:bg-amber-500 text-white border-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
              Popular skills
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SKILLS.filter(s => !selectedSkills.includes(s)).map(skill => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="text-xs px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900/40 text-zinc-500 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/5 transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Selected skills */}
          {selectedSkills.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
                Your skills ({selectedSkills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map(skill => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/8 text-amber-300 gap-1 pr-1"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-0.5 hover:text-red-400 transition-colors"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setStep("proficiency")}
            disabled={selectedSkills.length === 0}
            className="w-full gap-2 bg-amber-600 hover:bg-amber-500 text-white border-0"
          >
            Rate Your Skills
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Rate proficiency */}
      {step === "proficiency" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Rate your proficiency
            </h2>
            <p className="text-xs text-zinc-500 mt-1">1 = Novice, 5 = Expert</p>
          </div>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {selectedSkills.map(skill => (
                <SkillProficiencySelector
                  key={skill}
                  skill={skill}
                  value={proficiencies[skill] ?? 3}
                  onChange={v => setProficiencies(prev => ({ ...prev, [skill]: v }))}
                />
              ))}
            </div>
          </ScrollArea>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("skills")}
              className="border-zinc-700 bg-transparent hover:bg-zinc-800"
            >
              Back
            </Button>
            <Button
              onClick={() => void handleAssess()}
              disabled={loading || isLoading}
              className="flex-1 gap-2 bg-amber-600 hover:bg-amber-500 text-white border-0"
            >
              {loading
                ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assessing…
                  </>
                )
                : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run Assessment
                  </>
                )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === "results" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Your Career Matches
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {results.length} occupations matched
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("skills")}
              className="border-zinc-700 bg-transparent hover:bg-zinc-800 gap-1"
            >
              <Target className="w-3.5 h-3.5" />
              Re-assess
            </Button>
          </div>

          {results.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-600">
                <Target className="w-8 h-8 opacity-40" />
                <p className="text-sm">
                  No matches found. Try adding more skills.
                </p>
              </div>
            )
            : (
              <ScrollArea className="max-h-[520px]">
                <div className="space-y-3">
                  {results.map(match => (
                    <ResultCard
                      key={match.uri}
                      match={match}
                      onSelect={onSelectOccupation}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
        </div>
      )}
    </div>
  );
}
