"use client";

import { motion } from "framer-motion";
import { useInViewProgress } from "../../interactive/useInViewProgress";

/**
 * Character-by-character reveal with weight animation.
 * Each character starts invisible at weight 300 and animates to
 * visible at weight 500.
 */
export function TypeReveal({ children }: { children?: React.ReactNode }) {
  const { ref, progress } = useInViewProgress();
  const text = typeof children === "string" ? children : String(children ?? "");
  const chars = [...text];
  const visible = progress > 0.1;

  return (
    <span ref={ref} className="inline-block" aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          style={{ display: "inline-block" }}
          initial={{ opacity: 0, fontVariationSettings: '"wght" 300' }}
          animate={
            visible
              ? { opacity: 1, fontVariationSettings: '"wght" 500' }
              : { opacity: 0, fontVariationSettings: '"wght" 300' }
          }
          transition={{ duration: 0.3, delay: i * 0.03, ease: "easeOut" }}
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}
