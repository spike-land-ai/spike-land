interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

const PALETTE = [
  "var(--color-primary)",
  "var(--color-chart-2, #60a5fa)",
  "var(--color-chart-3, #34d399)",
  "var(--color-chart-4, #fbbf24)",
  "var(--color-chart-5, #f87171)",
  "var(--color-muted-foreground)",
];

interface MiniDonutProps {
  segments: DonutSegment[];
  size?: number;
}

export function MiniDonut({ segments, size = 100 }: MiniDonutProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={seg.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              transform="rotate(-90 50 50)"
            />
          );
        })}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dy="0.35em"
          className="fill-foreground text-xs font-bold"
          fontSize="14"
        >
          {total}
        </text>
      </svg>
      <div className="space-y-1">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: seg.color ?? PALETTE[i % PALETTE.length] }}
            />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium text-foreground">{seg.value}</span>
            <span className="text-muted-foreground">
              ({((seg.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
