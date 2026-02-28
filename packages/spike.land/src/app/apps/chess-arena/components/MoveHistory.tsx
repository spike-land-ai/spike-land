"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChessTheme } from "../themes";

interface MoveHistoryProps {
  moves: string[];
  theme: ChessTheme;
}

export function MoveHistory({ moves, theme }: MoveHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [moves.length]);

  const pairs: { number: number; white: string; black: string; }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i] ?? "",
      black: moves[i + 1] ?? "",
    });
  }

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: theme.panelBg,
        border: `1px solid ${theme.panelBorder}`,
      }}
    >
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Moves</h3>
      <ScrollArea className="h-40">
        <div className="space-y-1">
          {pairs.length === 0 && <p className="text-gray-500 text-sm">No moves yet</p>}
          {pairs.map(pair => (
            <div key={pair.number} className="flex text-sm font-mono">
              <span className="w-8 text-gray-500">{pair.number}.</span>
              <span className="w-16 text-gray-200">{pair.white}</span>
              <span className="w-16 text-gray-200">{pair.black}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
