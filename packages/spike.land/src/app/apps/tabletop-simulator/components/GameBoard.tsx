"use client";

import { motion } from "framer-motion";
import { Grid3x3, Layers, Move } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Card } from "@apps/tabletop-simulator/types/card";
import type { DiceState } from "@apps/tabletop-simulator/types/dice";

interface GameBoardProps {
  cards: Card[];
  dice: DiceState[];
  playerId: string | null;
  className?: string;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_COLORS: Record<string, string> = {
  hearts: "text-red-400",
  diamonds: "text-red-400",
  clubs: "text-white",
  spades: "text-white",
};

function CardToken(
  { card, playerId }: { card: Card; playerId: string | null; },
) {
  const isOwned = card.ownerId === playerId;
  const isGrabbed = !!card.grabbedBy;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={[
        "absolute flex flex-col items-center justify-center",
        "w-10 h-14 rounded border text-xs font-mono font-bold select-none",
        card.faceUp
          ? "bg-white text-zinc-900 border-zinc-300"
          : "bg-zinc-800 text-zinc-600 border-zinc-700",
        isGrabbed ? "ring-2 ring-offset-1 ring-blue-400" : "",
        isOwned && card.ownerId !== null ? "ring-2 ring-emerald-400" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${50 + card.position.x * 20}%`,
        top: `${50 + card.position.z * 20}%`,
        transform: `translate(-50%, -50%) rotate(${card.rotation.y * (180 / Math.PI)}deg)`,
        zIndex: card.zIndex,
      }}
    >
      {card.faceUp
        ? (
          <>
            <span>{card.rank}</span>
            <span className={SUIT_COLORS[card.suit]}>
              {SUIT_SYMBOLS[card.suit]}
            </span>
          </>
        )
        : <span className="text-base">🂠</span>}
    </motion.div>
  );
}

function DiceToken({ dice }: { dice: DiceState; }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={dice.isRolling
        ? { opacity: 1, scale: 1, rotate: [0, 360] }
        : { opacity: 1, scale: 1, rotate: 0 }}
      transition={dice.isRolling
        ? { duration: 0.6, repeat: 2 }
        : { duration: 0.2 }}
      className={[
        "absolute flex items-center justify-center",
        "w-10 h-10 rounded-lg border-2 font-bold text-sm select-none",
        dice.isRolling
          ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 animate-pulse"
          : "bg-zinc-800/90 border-zinc-500 text-white",
      ].join(" ")}
      style={{
        left: `${50 + dice.position.x * 20}%`,
        top: `${50 + dice.position.z * 20}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {dice.isRolling ? "?" : dice.value}
    </motion.div>
  );
}

export function GameBoard(
  { cards, dice, playerId, className }: GameBoardProps,
) {
  const tableCards = cards.filter(c => c.ownerId === null);
  const tableCardCount = tableCards.length;
  const tableDiceCount = dice.length;
  const handCardCount = cards.filter(c => c.ownerId === playerId).length;

  return (
    <div
      className={[
        "relative w-full h-full bg-emerald-950 rounded-xl overflow-hidden",
        "border border-emerald-800/50",
        className ?? "",
      ].join(" ")}
    >
      {/* Table felt texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-transparent to-black/30 pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Table center zone label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="border border-emerald-700/30 rounded-full w-48 h-48 flex items-center justify-center">
          <span className="text-emerald-700/30 text-xs font-bold tracking-widest uppercase">
            Play Area
          </span>
        </div>
      </div>

      {/* Render table cards */}
      {tableCards.map(card => <CardToken key={card.id} card={card} playerId={playerId} />)}

      {/* Render dice */}
      {dice.map(d => <DiceToken key={d.id} dice={d} />)}

      {/* Empty state */}
      {tableCardCount === 0 && tableDiceCount === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="flex items-center gap-2 text-emerald-700/50">
            <Layers className="w-8 h-8" />
          </div>
          <p className="text-emerald-700/40 text-sm font-medium">
            Board is empty — add dice or cards from the panel
          </p>
        </div>
      )}

      {/* Status bar */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <Badge
          variant="outline"
          className="bg-black/40 border-emerald-700/30 text-emerald-400 text-xs gap-1"
        >
          <Grid3x3 className="w-3 h-3" />
          {tableCardCount} cards
        </Badge>
        <Badge
          variant="outline"
          className="bg-black/40 border-emerald-700/30 text-emerald-400 text-xs gap-1"
        >
          <Move className="w-3 h-3" />
          {tableDiceCount} dice
        </Badge>
        {handCardCount > 0 && (
          <Badge
            variant="outline"
            className="bg-black/40 border-blue-700/30 text-blue-400 text-xs"
          >
            {handCardCount} in hand
          </Badge>
        )}
      </div>
    </div>
  );
}
