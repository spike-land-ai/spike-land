"use client";

import { useCallback, useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
}

const GRADIENT_COLORS = {
  start: "#10b981", // emerald-500
  mid: "#06b6d4", // cyan-500
  end: "#8b5cf6", // violet-500
};

export function WaveformVisualizer({
  currentTime,
  totalDuration,
  isPlaying,
  onSeek,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveDataRef = useRef<number[]>([]);
  const animRef = useRef<number | null>(null);

  // Generate fake waveform data on mount
  useEffect(() => {
    const bars = 200;
    const data: number[] = [];
    for (let i = 0; i < bars; i++) {
      // Create a realistic-looking waveform with some patterns
      const base = 0.3 + Math.random() * 0.4;
      const wave = Math.sin(i * 0.1) * 0.15;
      const envelope = 1 - Math.abs((i / bars - 0.5) * 0.4);
      data.push(Math.min(1, Math.max(0.05, (base + wave) * envelope)));
    }
    waveDataRef.current = data;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const data = waveDataRef.current;
    const bars = data.length;
    const barWidth = w / bars;
    const playheadX = totalDuration > 0 ? (currentTime / totalDuration) * w : 0;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw bars
    for (let i = 0; i < bars; i++) {
      const x = i * barWidth;
      const barH = (data[i] ?? 0.1) * (h * 0.8);
      const y = (h - barH) / 2;
      const isPast = x < playheadX;

      if (isPast) {
        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        gradient.addColorStop(0, GRADIENT_COLORS.start);
        gradient.addColorStop(0.5, GRADIENT_COLORS.mid);
        gradient.addColorStop(1, GRADIENT_COLORS.end);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.9;
      } else {
        ctx.fillStyle = "#71717a"; // zinc-500
        ctx.globalAlpha = 0.3;
      }

      const bw = Math.max(1, barWidth - 1);
      ctx.beginPath();
      if (bw > 3) {
        const r = Math.min(bw / 2, 2);
        ctx.roundRect(x, y, bw, barH, r);
      } else {
        ctx.rect(x, y, bw, barH);
      }
      ctx.fill();
    }

    // Playhead line
    if (totalDuration > 0) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Playhead dot
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(playheadX, h / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }, [currentTime, totalDuration]);

  // Redraw on state changes and animate during playback
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        draw();
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
      return () => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
      };
    } else {
      draw();
      return undefined;
    }
  }, [isPlaying, draw]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || totalDuration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    onSeek(ratio * totalDuration);
  }, [totalDuration, onSeek]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-24 cursor-pointer rounded-lg"
        onClick={handleClick}
        id="waveform-canvas"
      />
      {totalDuration <= 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-zinc-500">Upload tracks to see waveform</p>
        </div>
      )}
    </div>
  );
}
