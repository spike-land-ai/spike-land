"use client";

import { motion } from "framer-motion";
import { useInViewProgress } from "../../interactive/useInViewProgress";

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Text that builds from light to bold — growing emphasis.
 * Each successive word gets heavier and slightly larger.
 */
export function Crescendo({ children }: { children?: React.ReactNode }) {
  const { ref, progress } = useInViewProgress();
  const text = typeof children === "string" ? children : String(children ?? "");
  const words = splitWords(text);

  return (
    <span ref={ref} className="inline-flex flex-wrap gap-x-[0.3em] leading-relaxed">
      {words.map((word, i) => {
        const t = words.length > 1 ? i / (words.length - 1) : 1;
        const weight = lerp(300, 800, t);
        const scale = lerp(0.9, 1.15, t);

        return (
          <motion.span
            key={`${word}-${i}`}
            style={{
              fontVariationSettings: `"wght" ${weight}`,
              fontSize: `${scale}em`,
              display: "inline-block",
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: progress > 0.1 ? 1 : 0,
              y: progress > 0.1 ? 0 : 8,
            }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
}
