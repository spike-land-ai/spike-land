"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Users, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GameBoard } from "./GameBoard";
import { DiceRoller } from "./DiceRoller";
import { ChatPanel } from "./ChatPanel";
import { PieceManager } from "./PieceManager";
import type { DiceType } from "@apps/tabletop-simulator/types/dice";
import type { DiceRollResult } from "../hooks/useTabletop";
import type { GameMessage } from "@apps/tabletop-simulator/types/message";

interface GameDashboardProps {
  roomCode: string;
  playerId: string | null;
  diceHistory: DiceRollResult[];
  isRolling: boolean;
  onRollDice: (type: DiceType, count?: number) => Promise<void>;
  onClearHistory: () => void;
  onLeave: () => void;
}

export function GameDashboard({
  roomCode,
  playerId,
  diceHistory,
  isRolling,
  onRollDice,
  onClearHistory,
  onLeave,
}: GameDashboardProps) {
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [deckCardCount, setDeckCardCount] = useState(52);
  const [handCardCount, setHandCardCount] = useState(0);
  const [diceOnTable, setDiceOnTable] = useState(0);

  const handleRollDice = useCallback(
    async (type: DiceType) => {
      await onRollDice(type, 1);
      setDiceOnTable(n => n + 1);
    },
    [onRollDice],
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!playerId) return;
      const msg: GameMessage = {
        id: `${Date.now()}`,
        type: "chat",
        playerId,
        playerName: `Player ${playerId.slice(0, 4)}`,
        playerColor: "#3B82F6",
        content,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
    },
    [playerId],
  );

  const handleDraw = useCallback(() => {
    if (deckCardCount === 0) return;
    setDeckCardCount(n => Math.max(0, n - 1));
    setHandCardCount(n => n + 1);
    const msg: GameMessage = {
      id: `${Date.now()}`,
      type: "event",
      playerId: playerId ?? "unknown",
      playerName: `Player ${playerId?.slice(0, 4) ?? "??"}`,
      playerColor: "#10B981",
      content: "drew a card",
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
  }, [deckCardCount, playerId]);

  const handleShuffle = useCallback(() => {
    const msg: GameMessage = {
      id: `${Date.now()}`,
      type: "event",
      playerId: playerId ?? "unknown",
      playerName: `Player ${playerId?.slice(0, 4) ?? "??"}`,
      playerColor: "#8B5CF6",
      content: "shuffled the deck",
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
  }, [playerId]);

  const handleSpawnDeck = useCallback(() => {
    setDeckCardCount(52);
    const msg: GameMessage = {
      id: `${Date.now()}`,
      type: "event",
      playerId: playerId ?? "unknown",
      playerName: `Player ${playerId?.slice(0, 4) ?? "??"}`,
      playerColor: "#F59E0B",
      content: "spawned a new 52-card deck",
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
  }, [playerId]);

  const handleSpawnDice = useCallback(
    async (type: DiceType) => {
      await onRollDice(type, 1);
      setDiceOnTable(n => n + 1);
      const msg: GameMessage = {
        id: `${Date.now()}`,
        type: "event",
        playerId: playerId ?? "unknown",
        playerName: `Player ${playerId?.slice(0, 4) ?? "??"}`,
        playerColor: "#F59E0B",
        content: `added a ${type.toUpperCase()} to the table`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
    },
    [onRollDice, playerId],
  );

  const copyRoomCode = useCallback(() => {
    navigator.clipboard
      .writeText(roomCode)
      .then(() => toast.success("Room code copied!"))
      .catch(() => toast.error("Failed to copy"));
  }, [roomCode]);

  // Build mock card/dice arrays from state for display in GameBoard and PieceManager
  const mockCards = Array.from({ length: handCardCount }, (_, i) => ({
    id: `hand-${i}`,
    suit: "spades" as const,
    rank: "A" as const,
    faceUp: false,
    ownerId: playerId,
    position: { x: i * 0.2, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    zIndex: i,
  }));

  const mockDice = Array.from({ length: diceOnTable }, (_, i) => {
    const hist = diceHistory[diceHistory.length - 1 - i];
    return {
      id: hist?.id ?? `dice-${i}`,
      type: hist?.diceType ?? ("d6" as DiceType),
      value: hist?.results[0] ?? 0,
      position: { x: (i % 4) - 1.5, y: 0.1, z: Math.floor(i / 4) - 0.5 },
      rotation: { x: 0, y: 0, z: 0 },
      isRolling: false,
      seed: i,
      ownerId: playerId,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100dvh-3.5rem)] bg-zinc-950 overflow-hidden"
    >
      {/* Top bar */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-zinc-900/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-zinc-400 hover:text-white"
          onClick={onLeave}
        >
          <ArrowLeft className="w-4 h-4" />
          Lobby
        </Button>

        <div className="flex-1 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-mono text-white">{roomCode}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-zinc-500 hover:text-white"
              onClick={copyRoomCode}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-500">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs">1 player</span>
          </div>
        </div>

        <span className="text-xs text-zinc-600 font-mono hidden sm:block">
          pid: {playerId?.slice(0, 8)}
        </span>
      </header>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 overflow-hidden">
        {/* Left: Game board + dice */}
        <div className="flex flex-col gap-4 p-4 overflow-auto">
          <GameBoard
            cards={mockCards}
            dice={mockDice}
            playerId={playerId}
            className="flex-1 min-h-[280px] lg:min-h-[360px]"
          />
          <DiceRoller
            diceHistory={diceHistory}
            isRolling={isRolling}
            onRoll={handleRollDice}
            onClearHistory={onClearHistory}
          />
        </div>

        {/* Right: Sidebar with PieceManager + Chat */}
        <div className="flex flex-col gap-4 p-4 border-l border-white/10 overflow-auto">
          <PieceManager
            deckCardCount={deckCardCount}
            handCardCount={handCardCount}
            diceCount={diceOnTable}
            onSpawnDeck={handleSpawnDeck}
            onSpawnDice={type => void handleSpawnDice(type)}
            onShuffle={handleShuffle}
            onDraw={handleDraw}
          />
          <ChatPanel
            messages={messages}
            localPlayerId={playerId}
            onSendMessage={handleSendMessage}
            className="flex-1 min-h-[200px]"
          />
        </div>
      </div>
    </motion.div>
  );
}
