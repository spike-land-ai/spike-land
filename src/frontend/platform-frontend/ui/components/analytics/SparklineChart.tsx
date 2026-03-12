import { useState } from "react";

interface SparklineChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  secondaryData?: number[];
  secondaryColor?: string;
}

export function SparklineChart({
  data,
  labels,
  height = 60,
  color = "var(--color-primary)",
  secondaryData,
  secondaryColor = "var(--color-muted-foreground)",
}: SparklineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 300;
  const padding = 4;

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        Not enough data
      </div>
    );
  }

  function buildPoints(values: number[]): string {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const stepX = (width - padding * 2) / (values.length - 1);

    return values
      .map((v, i) => {
        const x = padding + i * stepX;
        const y = height - padding - ((v - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }

  const points = buildPoints(data);
  const secondaryPoints = secondaryData ? buildPoints(secondaryData) : null;
  const stepX = (width - padding * 2) / (data.length - 1);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * width;
          const idx = Math.round((x - padding) / stepX);
          setHoveredIndex(Math.max(0, Math.min(data.length - 1, idx)));
        }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {secondaryPoints && (
          <polyline
            points={secondaryPoints}
            fill="none"
            stroke={secondaryColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.5}
          />
        )}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {hoveredIndex !== null && (
          <circle
            cx={padding + hoveredIndex * stepX}
            cy={(() => {
              const max = Math.max(...data, 1);
              const min = Math.min(...data, 0);
              const range = max - min || 1;
              return (
                height - padding - ((data[hoveredIndex]! - min) / range) * (height - padding * 2)
              );
            })()}
            r="3"
            fill={color}
          />
        )}
      </svg>
      {hoveredIndex !== null && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-popover px-2 py-0.5 text-xs text-popover-foreground shadow-sm">
          {labels?.[hoveredIndex] ?? ""} {data[hoveredIndex]}
          {secondaryData && ` / ${secondaryData[hoveredIndex]}`}
        </div>
      )}
    </div>
  );
}
