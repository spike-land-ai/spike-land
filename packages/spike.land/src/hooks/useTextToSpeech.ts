"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TTSState = "idle" | "loading" | "playing" | "error";

interface UseTextToSpeechReturn {
  state: TTSState;
  play: (text: string) => Promise<void>;
  stop: () => void;
}

// Client-side URL cache to avoid re-fetching
const urlCache = new Map<string, string>();

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [state, setState] = useState<TTSState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (mountedRef.current) {
      setState("idle");
    }
  }, []);

  const play = useCallback(async (text: string) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!mountedRef.current) return;
    setState("loading");

    try {
      let url = urlCache.get(text);

      if (!url) {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("audio/")) {
          // Direct audio response (fallback when R2 is unavailable)
          const blob = await response.blob();
          url = URL.createObjectURL(blob);
        } else {
          const data = await response.json();
          url = data.url;
        }

        if (url) {
          urlCache.set(text, url);
        }
      }

      if (!url || !mountedRef.current) {
        if (mountedRef.current) setState("error");
        return;
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("ended", () => {
        if (mountedRef.current) {
          setState("idle");
        }
        audioRef.current = null;
      });

      audio.addEventListener("error", () => {
        if (mountedRef.current) {
          setState("error");
        }
        audioRef.current = null;
      });

      if (!mountedRef.current) return;
      setState("playing");
      await audio.play();
    } catch {
      if (mountedRef.current) {
        setState("error");
      }
    }
  }, []);

  return { state, play, stop };
}
