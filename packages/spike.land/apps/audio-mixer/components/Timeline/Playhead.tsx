/**
 * Playhead Component - Vertical line indicating current playback position
 */

"use client";

import { useCallback, useRef } from "react";

interface PlayheadProps {
  time: number;
  zoom: number;
  height: number;
  onSeek?: (time: number) => void;
}

export function Playhead({ time, zoom, height, onSeek }: PlayheadProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startTime = useRef(0);

  const position = time * zoom;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onSeek) return;
      e.preventDefault();
      e.stopPropagation();

      isDragging.current = true;
      startX.current = e.clientX;
      startTime.current = time;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;

        const deltaX = moveEvent.clientX - startX.current;
        const deltaTime = deltaX / zoom;
        const newTime = Math.max(0, startTime.current + deltaTime);
        onSeek(newTime);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [time, zoom, onSeek],
  );

  return (
    <div
      className="absolute top-0 z-50 pointer-events-none transition-opacity duration-300"
      style={{
        left: `${position}px`,
        height: `${height}px`,
      }}
    >
      {/* Playhead handle (draggable) */}
      <div
        className="absolute -top-3 -left-2.5 w-5 h-5 bg-primary/90 rounded-full cursor-ew-resize pointer-events-auto hover:bg-primary transition-all shadow-glow-cyan-sm active:scale-110 flex items-center justify-center border border-white/20"
        onMouseDown={handleMouseDown}
        role="slider"
        tabIndex={0}
        aria-label="Playhead - drag to seek"
        aria-valuenow={0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full" />
      </div>
      {/* Playhead line */}
      <div
        className="w-[3px] bg-primary shadow-glow-cyan-sm relative"
        style={{ height: `${height}px` }}
      >
        {/* Subtle gradient glow tail */}
        <div className="absolute inset-x-0 top-0 w-full h-full bg-gradient-to-b from-primary/50 to-transparent opacity-30" />
      </div>
    </div>
  );
}
