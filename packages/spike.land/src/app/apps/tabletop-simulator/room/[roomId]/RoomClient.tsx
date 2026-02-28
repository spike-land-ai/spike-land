"use client";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GameProvider,
  useGame,
} from "@apps/tabletop-simulator/components/providers/GameProvider";
import { ControlsPanel } from "@apps/tabletop-simulator/components/ui/ControlsPanel";
import { GameSidebar } from "@apps/tabletop-simulator/components/ui/GameSidebar";
import { HandDrawer } from "@apps/tabletop-simulator/components/ui/HandDrawer";
import { TopAppBar } from "@apps/tabletop-simulator/components/ui/TopAppBar";
import { VideoOverlay } from "@apps/tabletop-simulator/components/ui/VideoOverlay";
import { useYjsState } from "@apps/tabletop-simulator/hooks/useYjsState";
import {
  addDice,
  addMessage,
  drawCard,
  flipCard,
  grabCard,
  initializeDeck,
  moveCard,
  playCard,
  releaseCard,
  settleDice,
  updateDeck,
} from "@apps/tabletop-simulator/lib/crdt/game-document";
import {
  createStandardDeck,
  shuffleDeck,
} from "@apps/tabletop-simulator/lib/game-logic/deck";
import type { DiceType } from "@apps/tabletop-simulator/types/dice";

const GameScene = dynamic(
  () => import("@apps/tabletop-simulator/components/GameScene"),
  {
    ssr: false,
    loading: () => <div className="text-white p-4">Loading 3D Engine...</div>,
  },
);

function GameUI() {
  const game = useGame();
  const [deckInitialized, setDeckInitialized] = useState(false);
  const autoConnectAttempted = useRef(false);

  // Subscribe to Yjs state changes, pass isSynced to ensure refresh after persistence loads
  const gameState = useYjsState(game?.doc ?? null, game?.isSynced ?? false);

  // Auto-connect to host peer from URL parameter
  useEffect(() => {
    if (!game?.peerId || !game.connectToPeer || autoConnectAttempted.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hostPeerId = params.get("host");

    if (hostPeerId && hostPeerId !== game.peerId) {
      autoConnectAttempted.current = true;
      game.connectToPeer(hostPeerId);
    }
  }, [game, game?.peerId, game?.connectToPeer]);

  // Update URL with own peer ID so the link can be shared
  useEffect(() => {
    if (!game?.peerId) return;

    const url = new URL(window.location.href);
    // Only update if there's no host param or we are the first peer
    if (!url.searchParams.has("host")) {
      url.searchParams.set("host", game.peerId);
      window.history.replaceState({}, "", url.toString());
    }
  }, [game?.peerId]);

  // Initialize deck if empty (only once after sync is complete)
  useEffect(() => {
    if (!game?.doc || !game.isSynced || deckInitialized) {
      return;
    }
    // Small delay to ensure state has been refreshed from persistence
    const timer = setTimeout(() => {
      if (gameState.cards.length === 0) {
        const cards = createStandardDeck();
        // Shuffle the deck on initialization so cards aren't in suit order
        const shuffledCards = shuffleDeck(cards, Date.now());
        initializeDeck(game.doc, shuffledCards);
      }
      setDeckInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [game?.doc, game?.isSynced, gameState.cards.length, deckInitialized]);

  const handleDiceRoll = useCallback((type: string) => {
    if (!game?.doc) return;

    const seed = Date.now();
    const diceState = {
      id: nanoid(),
      type: type as DiceType,
      value: 0,
      position: { x: Math.random() * 2 - 1, y: 2, z: Math.random() * 2 - 1 },
      rotation: { x: 0, y: 0, z: 0 },
      isRolling: true,
      seed,
      ownerId: game.peerId,
    };

    addDice(game.doc, diceState);
  }, [game?.doc, game?.peerId]);

  const handleCardMove = useCallback(
    (id: string, position: { x: number; y: number; z: number; }) => {
      if (!game?.doc) return;
      moveCard(game.doc, id, position);
    },
    [game?.doc],
  );

  const handleCardFlip = useCallback((id: string) => {
    if (!game?.doc) return;
    flipCard(game.doc, id);
  }, [game?.doc]);

  const handleCardGrab = useCallback((id: string) => {
    if (!game?.doc || !game.peerId) return;
    const peerId = game.peerId;
    // Use a player color based on peer ID hash
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#F97316",
    ] as const;
    const colorIndex = parseInt(peerId.slice(0, 4), 16) % colors.length;
    grabCard(game.doc, id, {
      playerId: peerId,
      playerName: `Player ${peerId.slice(0, 4)}`,
      playerColor: colors[colorIndex] ?? "#3B82F6",
    });
  }, [game?.doc, game?.peerId]);

  const handleCardRelease = useCallback((id: string) => {
    if (!game?.doc) return;

    // Find card to get current transform
    const card = gameState.cards.find(c => c.id === id);
    if (card) {
      // Snap to table surface
      // Keep X/Z position
      // Snap Y to 0.01 (just above table) to prevent clipping
      // Snap Rotation X to -PI/2 (flat)
      // Keep Rotation Y (spin) but clean up slightly? No, keep it free.
      // Reset Rotation Z to 0 (tilt)
      moveCard(game.doc, id, { ...card.position, y: 0.01 }, {
        x: -Math.PI / 2,
        y: card.rotation.y,
        z: 0,
      });
    }

    releaseCard(game.doc, id);
  }, [game?.doc, gameState.cards]);

  const handleDiceSettle = useCallback((id: string, value: number) => {
    if (!game?.doc) return;
    settleDice(game.doc, id, value);
  }, [game?.doc]);

  const handleDeckDraw = useCallback(() => {
    if (!game?.doc || !game.peerId) return;
    drawCard(game.doc, game.peerId);
  }, [game?.doc, game?.peerId]);

  const handleDeckShuffle = useCallback(() => {
    if (!game?.doc) return;
    const currentCards = gameState.cards.filter(c => c.ownerId === null);
    if (currentCards.length > 0) {
      const shuffled = shuffleDeck(currentCards, Date.now());
      updateDeck(game.doc, [
        ...shuffled,
        ...gameState.cards.filter(c => c.ownerId !== null),
      ]);
    }
  }, [game?.doc, gameState.cards]);

  const handlePlayCard = useCallback((cardId: string) => {
    if (!game?.doc) return;
    // Play card to center of table
    playCard(game.doc, cardId, {
      x: Math.random() * 4 - 2,
      y: 0.1,
      z: Math.random() * 4 - 2,
    });
  }, [game?.doc]);

  const handleToggleVideo = useCallback(async () => {
    if (!game?.media) return;

    if (game.media.localStream) {
      // Turn off camera
      game.media.localStream.getTracks().forEach(track => track.stop());
      // Note: The hook doesn't expose a way to clear localStream, but stopping tracks is enough
    } else {
      // Turn on camera and call all connected peers
      const stream = await game.media.enableMedia(true, true);
      if (stream && game.connections.size > 0) {
        // Give a moment for the stream to be ready, then call all peers
        setTimeout(() => {
          game.media.callAll();
        }, 100);
      }
    }
  }, [game?.media, game?.connections]);

  // Handle sending chat messages
  const handleSendMessage = useCallback((content: string) => {
    if (!game?.doc || !game.peerId) return;
    addMessage(game.doc, {
      id: nanoid(),
      type: "chat",
      playerId: game.peerId,
      playerName: `Player ${game.peerId.slice(0, 4)}`,
      playerColor: "#3B82F6", // Default blue, could be dynamic
      content,
      timestamp: Date.now(),
    });
  }, [game?.doc, game?.peerId]);

  // Handle spawning objects from library
  const handleSpawnObject = useCallback(
    (type: "deck" | "d6" | "d20" | "token") => {
      if (!game?.doc || !game.peerId) return;

      if (type === "deck") {
        // Reset and shuffle deck
        const cards = createStandardDeck();
        const shuffled = shuffleDeck(cards, Date.now());
        initializeDeck(game.doc, shuffled);
      } else if (type === "d6" || type === "d20") {
        const seed = Date.now();
        const diceState = {
          id: nanoid(),
          type: type as DiceType,
          value: 0,
          position: {
            x: Math.random() * 2 - 1,
            y: 2,
            z: Math.random() * 2 - 1,
          },
          rotation: { x: 0, y: 0, z: 0 },
          isRolling: true,
          seed,
          ownerId: game.peerId,
        };
        addDice(game.doc, diceState);
      }
      // Token spawning can be added later
    },
    [game?.doc, game?.peerId],
  );

  if (!game) return null;

  const { ui, media, peerId } = game;

  // Get cards in player's hand
  const handCards = gameState.cards.filter(card => card.ownerId === peerId);

  // Calculate other players' hand counts
  const otherPlayersHands = new Map<string, number>();
  gameState.cards.forEach(card => {
    if (card.ownerId && card.ownerId !== peerId) {
      const current = otherPlayersHands.get(card.ownerId) ?? 0;
      otherPlayersHands.set(card.ownerId, current + 1);
    }
  });

  // Build players list for sidebar
  const players = [
    {
      id: peerId || "",
      peerId: peerId || "",
      name: `Player ${peerId?.slice(0, 4)}`,
      cardCount: handCards.length,
    },
    ...Array.from(otherPlayersHands.entries()).map(([id, count]) => ({
      id,
      peerId: id,
      name: `Player ${id.slice(0, 4)}`,
      cardCount: count,
    })),
  ];

  // Connection status
  const connectionStatus = game.isSynced
    ? "connected"
    : game.connections.size > 0
    ? "connecting"
    : "disconnected";

  return (
    <>
      <GameScene
        cards={gameState.cards}
        dice={gameState.dice}
        playerId={peerId}
        interactionMode={ui.interactionMode}
        onCardMove={handleCardMove}
        onCardFlip={handleCardFlip}
        onCardGrab={handleCardGrab}
        onCardRelease={handleCardRelease}
        onDiceSettle={handleDiceSettle}
        onDeckDraw={handleDeckDraw}
        onDeckShuffle={handleDeckShuffle}
      />

      {/* Top App Bar */}
      <TopAppBar
        roomCode={peerId || "---"}
        connectionStatus={connectionStatus as
          | "connected"
          | "connecting"
          | "disconnected"}
        playerCount={game.connections.size + 1}
        onSidebarToggle={ui.toggleSidebar}
        isMobile={ui.isMobile}
      />

      {/* Right Sidebar */}
      <GameSidebar
        isOpen={ui.sidebarOpen}
        onClose={() => ui.setSidebarOpen(false)}
        activeTab={ui.sidebarTab}
        onTabChange={ui.setSidebarTab}
        players={players}
        messages={gameState.messages}
        localPlayerId={peerId}
        onSendMessage={handleSendMessage}
        onSpawnObject={handleSpawnObject}
        isMobile={ui.isMobile}
      />

      <VideoOverlay
        localStream={media.localStream}
        remoteStreams={media.remoteStreams}
      />
      <ControlsPanel
        mode={ui.interactionMode}
        onToggleMode={ui.toggleMode}
        onDiceRoll={handleDiceRoll}
        onToggleVideo={handleToggleVideo}
        videoEnabled={!!media.localStream}
      />
      <HandDrawer
        hand={handCards}
        onPlayCard={handlePlayCard}
      />
    </>
  );
}

export default function RoomClient({ roomId }: { roomId: string; }) {
  return (
    <GameProvider roomId={roomId}>
      <div className="w-full h-[calc(100dvh-3.5rem)] bg-black overflow-hidden relative text-white">
        <GameUI />
      </div>
    </GameProvider>
  );
}
