import { useState } from "react";

interface BadgeDisplayProps {
  token: string;
  topic: string;
  score: number;
  completedAt: string;
}

export function BadgeDisplay({ token, topic, score, completedAt }: BadgeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const badgeUrl = `${window.location.origin}/learn/badge/${token}`;
  const scoreColor =
    score >= 80
      ? "text-success-foreground"
      : score >= 60
        ? "text-warning-foreground"
        : "text-destructive-foreground";
  const scoreLabel = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Passing";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(badgeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = badgeUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
      <div className="text-center">
        <div className="mb-4 text-5xl">🎓</div>
        <h2 className="text-xl font-bold text-foreground">{topic}</h2>
        <div className={`mt-2 text-4xl font-extrabold ${scoreColor}`}>{score}%</div>
        <div className={`mt-1 text-sm font-semibold uppercase tracking-wide ${scoreColor}`}>
          {scoreLabel}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Completed{" "}
          {new Date(completedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Share this badge</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={badgeUrl}
            className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground"
          />
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Verified learning badge from spike.land
      </p>
    </div>
  );
}
