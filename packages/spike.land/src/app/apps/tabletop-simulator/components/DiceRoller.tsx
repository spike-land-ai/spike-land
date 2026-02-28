"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dices, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiceType } from "@apps/tabletop-simulator/types/dice";
import type { DiceRollResult } from "../hooks/useTabletop";

interface DiceRollerProps {
  diceHistory: DiceRollResult[];
  isRolling: boolean;
  onRoll: (type: DiceType) => Promise<void>;
  onClearHistory: () => void;
  className?: string;
}

const DICE_CONFIGS: {
  type: DiceType;
  faces: number;
  color: string;
  bgColor: string;
}[] = [
  {
    type: "d4",
    faces: 4,
    color: "text-purple-300",
    bgColor: "bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30",
  },
  {
    type: "d6",
    faces: 6,
    color: "text-blue-300",
    bgColor: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30",
  },
  {
    type: "d8",
    faces: 8,
    color: "text-cyan-300",
    bgColor: "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/30",
  },
  {
    type: "d10",
    faces: 10,
    color: "text-teal-300",
    bgColor: "bg-teal-500/20 hover:bg-teal-500/30 border-teal-500/30",
  },
  {
    type: "d12",
    faces: 12,
    color: "text-emerald-300",
    bgColor: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30",
  },
  {
    type: "d20",
    faces: 20,
    color: "text-yellow-300",
    bgColor: "bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30",
  },
];

export function DiceRoller({
  diceHistory,
  isRolling,
  onRoll,
  onClearHistory,
  className,
}: DiceRollerProps) {
  const [activeType, setActiveType] = useState<DiceType | null>(null);

  const handleRoll = useCallback(
    async (type: DiceType) => {
      if (isRolling) return;
      setActiveType(type);
      await onRoll(type);
      setActiveType(null);
    },
    [isRolling, onRoll],
  );

  return (
    <Card
      className={[
        "bg-white/5 border-white/10 backdrop-blur-sm",
        className ?? "",
      ].join(" ")}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Dices className="w-4 h-4 text-yellow-400" />
          Dice Roller
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dice buttons */}
        <div className="grid grid-cols-3 gap-2">
          {DICE_CONFIGS.map(({ type, faces, color, bgColor }) => (
            <button
              key={type}
              onClick={() => void handleRoll(type)}
              disabled={isRolling}
              className={[
                "flex flex-col items-center justify-center gap-0.5",
                "h-14 rounded-lg border font-bold text-sm transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                bgColor,
                activeType === type
                  ? "scale-95 opacity-70"
                  : "hover:scale-[1.03]",
              ].join(" ")}
            >
              <AnimatePresence mode="wait">
                {activeType === type
                  ? (
                    <motion.span
                      key="rolling"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0 }}
                      className={`text-lg ${color}`}
                    >
                      ?
                    </motion.span>
                  )
                  : (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-lg ${color}`}
                    >
                      {type.toUpperCase()}
                    </motion.span>
                  )}
              </AnimatePresence>
              <span className="text-[10px] text-zinc-500">{faces} sides</span>
            </button>
          ))}
        </div>

        {/* Results history */}
        {diceHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Results
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-zinc-500 hover:text-white"
                onClick={onClearHistory}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              <AnimatePresence initial={false}>
                {diceHistory.slice(0, 10).map(roll => {
                  const cfg = DICE_CONFIGS.find(
                    d => d.type === roll.diceType,
                  );

                  return (
                    <motion.div
                      key={roll.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={[
                        "flex items-center justify-between px-3 py-1.5 rounded-md text-sm",
                        roll.isCritical
                          ? "bg-yellow-500/15 border border-yellow-500/30"
                          : roll.isFumble
                          ? "bg-red-500/10 border border-red-500/20"
                          : "bg-white/5",
                      ].join(" ")}
                    >
                      <span className={cfg?.color ?? "text-white"}>
                        {roll.diceType.toUpperCase()}
                        {roll.results.length > 1
                          ? `×${roll.results.length}`
                          : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        {roll.isCritical && (
                          <span className="text-[10px] text-yellow-400 font-bold">
                            CRIT!
                          </span>
                        )}
                        {roll.isFumble && (
                          <span className="text-[10px] text-red-400 font-bold">
                            FUMBLE
                          </span>
                        )}
                        <span
                          className={[
                            "font-bold text-base tabular-nums",
                            roll.isCritical
                              ? "text-yellow-300"
                              : roll.isFumble
                              ? "text-red-400"
                              : "text-white",
                          ].join(" ")}
                        >
                          {roll.total}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
