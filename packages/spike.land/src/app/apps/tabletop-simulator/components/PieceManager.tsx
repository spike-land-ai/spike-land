"use client";

import { motion } from "framer-motion";
import { Layers, Plus, RefreshCw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiceType } from "@apps/tabletop-simulator/types/dice";

interface PieceManagerProps {
  deckCardCount: number;
  handCardCount: number;
  diceCount: number;
  onSpawnDeck: () => void;
  onSpawnDice: (type: DiceType) => void;
  onShuffle: () => void;
  onDraw: () => void;
  disabled?: boolean;
  className?: string;
}

const QUICK_DICE: { type: DiceType; label: string; }[] = [
  { type: "d6", label: "D6" },
  { type: "d20", label: "D20" },
];

export function PieceManager({
  deckCardCount,
  handCardCount,
  diceCount,
  onSpawnDeck,
  onSpawnDice,
  onShuffle,
  onDraw,
  disabled = false,
  className,
}: PieceManagerProps) {
  return (
    <Card
      className={[
        "bg-white/5 border-white/10 backdrop-blur-sm",
        className ?? "",
      ].join(" ")}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Pieces
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <motion.div
            key={deckCardCount}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="rounded-lg bg-white/5 p-2"
          >
            <div className="text-xl font-bold text-white tabular-nums">
              {deckCardCount}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Deck
            </div>
          </motion.div>
          <motion.div
            key={handCardCount}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="rounded-lg bg-white/5 p-2"
          >
            <div className="text-xl font-bold text-emerald-400 tabular-nums">
              {handCardCount}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              In Hand
            </div>
          </motion.div>
          <motion.div
            key={diceCount}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="rounded-lg bg-white/5 p-2"
          >
            <div className="text-xl font-bold text-yellow-400 tabular-nums">
              {diceCount}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Dice Out
            </div>
          </motion.div>
        </div>

        {/* Deck actions */}
        <div className="space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            Deck
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-1.5 text-xs"
              onClick={onSpawnDeck}
              disabled={disabled}
            >
              <Plus className="w-3 h-3" />
              New Deck
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-1.5 text-xs"
              onClick={onShuffle}
              disabled={disabled || deckCardCount === 0}
            >
              <Shuffle className="w-3 h-3" />
              Shuffle
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 gap-1.5 text-xs"
            onClick={onDraw}
            disabled={disabled || deckCardCount === 0}
          >
            <RefreshCw className="w-3 h-3" />
            Draw Card ({deckCardCount} left)
          </Button>
        </div>

        {/* Dice actions */}
        <div className="space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            Add Dice
          </span>
          <div className="flex gap-2">
            {QUICK_DICE.map(({ type, label }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="flex-1 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 gap-1 text-xs"
                onClick={() => onSpawnDice(type)}
                disabled={disabled}
              >
                <Plus className="w-3 h-3" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
