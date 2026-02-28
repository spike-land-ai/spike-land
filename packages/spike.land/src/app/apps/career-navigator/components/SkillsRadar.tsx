"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Minus, TrendingDown, TrendingUp, Zap } from "lucide-react";

export interface SkillEntry {
  name: string;
  level: number; // 0-100
  category: string;
  trend?: "up" | "down" | "stable";
}

interface SkillsRadarProps {
  skills: SkillEntry[];
  onAnalyze?: () => void;
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, { bar: string; badge: string; }> = {
  Languages: {
    bar: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  Frameworks: {
    bar: "bg-purple-500",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  Architecture: {
    bar: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  Emerging: {
    bar: "bg-green-500",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  Tools: {
    bar: "bg-cyan-500",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  Soft: {
    bar: "bg-rose-500",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

const DEFAULT_COLORS = {
  bar: "bg-zinc-500",
  badge: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
};

function getLevelLabel(level: number): { label: string; color: string; } {
  if (level >= 80) return { label: "Expert", color: "text-green-400" };
  if (level >= 60) return { label: "Advanced", color: "text-amber-400" };
  if (level >= 40) return { label: "Intermediate", color: "text-blue-400" };
  if (level >= 20) return { label: "Beginner", color: "text-zinc-400" };
  return { label: "Novice", color: "text-zinc-500" };
}

function TrendIcon({ trend }: { trend: SkillEntry["trend"]; }) {
  if (trend === "up") return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (trend === "down") {
    return <TrendingDown className="w-3 h-3 text-red-400" />;
  }
  return <Minus className="w-3 h-3 text-zinc-600" />;
}

// SVG Radar Chart (pentagon/hexagon shape)
function RadarChart({ skills }: { skills: SkillEntry[]; }) {
  const displaySkills = skills.slice(0, 6);
  const count = displaySkills.length;

  const cx = 120;
  const cy = 120;
  const maxR = 90;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const angleStep = count > 0 ? (2 * Math.PI) / count : 0;
  const getPoint = (index: number, r: number) => {
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const gridPaths = levels.map(lvl => {
    const pts = displaySkills.map((_, i) => {
      const p = getPoint(i, maxR * lvl);
      return `${p.x},${p.y}`;
    });
    return pts.join(" ");
  });

  const dataPath = displaySkills.map((skill, i) => {
    const r = (skill.level / 100) * maxR;
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  if (count < 3) return null;

  return (
    <svg
      viewBox="0 0 240 240"
      className="w-full max-w-[240px] mx-auto"
      aria-label="Skills radar chart"
    >
      {/* Grid levels */}
      {gridPaths.map((path, idx) => (
        <polygon
          key={idx}
          points={path}
          fill="none"
          stroke="rgb(63 63 70)"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {displaySkills.map((_, i) => {
        const p = getPoint(i, maxR);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgb(63 63 70)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPath}
        fill="rgba(245,158,11,0.15)"
        stroke="rgb(245,158,11)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {displaySkills.map((skill, i) => {
        const r = (skill.level / 100) * maxR;
        const p = getPoint(i, r);
        return <circle key={i} cx={p.x} cy={p.y} r="3" fill="rgb(245,158,11)" />;
      })}

      {/* Labels */}
      {displaySkills.map((skill, i) => {
        const p = getPoint(i, maxR + 18);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="rgb(161 161 170)"
          >
            {skill.name.length > 10 ? skill.name.slice(0, 9) + "…" : skill.name}
          </text>
        );
      })}
    </svg>
  );
}

export function SkillsRadar({ skills, isLoading = false }: SkillsRadarProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, SkillEntry[]>();
    for (const skill of skills) {
      const arr = map.get(skill.category) ?? [];
      arr.push(skill);
      map.set(skill.category, arr);
    }
    return map;
  }, [skills]);

  const avgLevel = useMemo(() => {
    if (skills.length === 0) return 0;
    return Math.round(
      skills.reduce((sum, s) => sum + s.level, 0) / skills.length,
    );
  }, [skills]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-[240px] rounded-2xl bg-zinc-800/50" />
        {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-zinc-800/50" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-zinc-300">
            {skills.length} skills tracked
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">Avg level</span>
          <span className="text-sm font-bold text-amber-400">{avgLevel}%</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <RadarChart skills={skills} />
      </div>

      {/* Skill bars by category */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 divide-y divide-zinc-800/50">
        {skills.map(skill => {
          const colors = CATEGORY_COLORS[skill.category] ?? DEFAULT_COLORS;
          const { label, color } = getLevelLabel(skill.level);
          return (
            <div key={skill.name} className="px-4 py-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-zinc-200 truncate">
                    {skill.name}
                  </span>
                  {skill.trend && <TrendIcon trend={skill.trend} />}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 border ${colors.badge}`}
                  >
                    {skill.category}
                  </Badge>
                  <span className={`text-[10px] font-semibold ${color}`}>
                    {label}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 w-7 text-right">
                    {skill.level}%
                  </span>
                </div>
              </div>
              <Progress
                value={skill.level}
                className="h-1.5 bg-zinc-800"
              />
            </div>
          );
        })}
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-2 gap-2">
        {Array.from(grouped.entries()).map(([category, catSkills]) => {
          const avg = Math.round(
            catSkills.reduce((s, sk) => s + sk.level, 0) / catSkills.length,
          );
          const colors = CATEGORY_COLORS[category] ?? DEFAULT_COLORS;
          return (
            <div
              key={category}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">
                  {category}
                </span>
                <span className="text-xs font-bold text-zinc-300">{avg}%</span>
              </div>
              <Progress
                value={avg}
                className={`h-1 bg-zinc-800 [&>div]:${colors.bar}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
