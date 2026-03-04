interface Conflict {
  concept: string;
  round: number;
  detail: string;
}

interface ConflictAlertProps {
  conflicts: Conflict[];
}

export function ConflictAlert({ conflicts }: ConflictAlertProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-warning bg-warning/10 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">⚠️</span>
        <div>
          <h4 className="text-sm font-semibold text-warning-foreground">
            Contradiction Detected ({conflicts.length})
          </h4>
          <p className="mt-1 text-sm text-warning-foreground/80">
            Your answers contradict previous responses. Concept mastery has been reset.
          </p>
          <ul className="mt-2 space-y-1">
            {conflicts.map((c, i) => (
              <li key={i} className="text-xs text-warning-foreground/70">
                <span className="font-medium">{c.concept}</span> — {c.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
