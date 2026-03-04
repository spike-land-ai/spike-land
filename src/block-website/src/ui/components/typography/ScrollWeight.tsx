"use client";

import { useInViewProgress } from "../../interactive/useInViewProgress";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Wraps text whose font-weight shifts from 300→700 as the user scrolls
 * the section into view. Pure CSS transition — no Framer Motion needed.
 */
export function ScrollWeight({ children }: { children?: React.ReactNode }) {
  const { ref, progress } = useInViewProgress();
  const weight = lerp(300, 700, progress);

  return (
    <span
      ref={ref}
      style={{
        fontVariationSettings: `"wght" ${weight}`,
        transition: "font-variation-settings 0.1s ease-out",
      }}
    >
      {children}
    </span>
  );
}
