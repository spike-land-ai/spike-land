interface ConceptProgress {
  concept: string;
  mastered: boolean;
  correctCount: number;
  attempts: number;
}

interface QuizProgressProps {
  progress: ConceptProgress[];
  masteryThreshold?: number;
}

export function QuizProgress({ progress, masteryThreshold = 2 }: QuizProgressProps) {
  const masteredCount = progress.filter((p) => p.mastered).length;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Concept Mastery
        </h3>
        <span className="text-sm font-medium text-muted-foreground">
          {masteredCount}/{progress.length} mastered
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{
            width: `${progress.length > 0 ? (masteredCount / progress.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Per-concept progress */}
      <div className="space-y-3">
        {progress.map((p) => (
          <div key={p.concept} className="flex items-center gap-3">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                p.mastered
                  ? "bg-success/15 text-success-foreground"
                  : p.correctCount > 0
                    ? "bg-warning/15 text-warning-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {p.mastered ? "✓" : p.correctCount}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{p.concept}</span>
                <span className="text-xs text-muted-foreground">
                  {p.correctCount}/{masteryThreshold}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    p.mastered ? "bg-success" : "bg-primary"
                  }`}
                  style={{
                    width: `${Math.min((p.correctCount / masteryThreshold) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
