"use client";

import { useEffect } from "react";

/** Load Rubik Glitch from Google Fonts on demand */
function useGlitchFont() {
  useEffect(() => {
    const id = "gf-rubik-glitch";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap";
    document.head.appendChild(link);
  }, []);
}

/**
 * Renders text in Rubik Glitch with a CSS glitch animation.
 * The font loads on-demand when the component mounts.
 */
export function GlitchText({ children }: { children?: React.ReactNode }) {
  useGlitchFont();

  return (
    <span
      className="glitch-text relative inline-block"
      style={{ fontFamily: '"Rubik Glitch", sans-serif' }}
      data-text={typeof children === "string" ? children : undefined}
    >
      {children}
      <style>{`
        @keyframes glitch-shift {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          20% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 1px); }
          40% { clip-path: inset(50% 0 20% 0); transform: translate(2px, -1px); }
          60% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 2px); }
          80% { clip-path: inset(80% 0 5% 0); transform: translate(1px, -2px); }
        }
        .glitch-text {
          animation: glitch-shift 3s infinite;
          animation-timing-function: steps(1, end);
        }
      `}</style>
    </span>
  );
}
