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
 * Text that gets progressively smaller and lighter — a visual whisper.
 * Each word renders at decreasing size and weight as you read left to right.
 */
export function Whisper({ children }: { children?: React.ReactNode }) {
  const { ref, progress } = useInViewProgress();
  const text = typeof children === "string" ? children : String(children ?? "");
  const words = splitWords(text);

  return (
    <span ref={ref} className="inline-flex flex-wrap gap-x-[0.25em] leading-relaxed">
      {words.map((word, i) => {
        const t = words.length > 1 ? i / (words.length - 1) : 0;
        const weight = lerp(400, 300, t);
        const scale = lerp(1, 0.75, t);
        const opacity = lerp(1, 0.5, t);

        return (
          <motion.span
            key={`${word}-${i}`}
            style={{
              fontVariationSettings: `"wght" ${weight}`,
              fontSize: `${scale}em`,
              display: "inline-block",
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{
              opacity: progress > 0.1 ? opacity : 0,
              y: progress > 0.1 ? 0 : 4,
            }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
}
