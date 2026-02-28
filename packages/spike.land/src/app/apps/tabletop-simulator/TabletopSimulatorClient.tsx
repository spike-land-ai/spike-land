"use client";

import { useTabletop } from "./hooks/useTabletop";
import { LobbyView } from "./components/LobbyView";
import { GameDashboard } from "./components/GameDashboard";

export function TabletopSimulatorClient() {
  const tabletop = useTabletop();

  // The lobby page — room creation/joining
  // The actual game board lives at /room/[roomId] via RoomClient.tsx
  // This client shows a preview/demo of the game components when in "game" view
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-white">
      {tabletop.view === "lobby"
        ? (
          <LobbyView
            inputRoomCode={tabletop.inputRoomCode}
            connectionStatus={tabletop.connectionStatus}
            errorMessage={tabletop.errorMessage}
            isCreatingRoom={tabletop.isCreatingRoom}
            setInputRoomCode={tabletop.setInputRoomCode}
            createRoom={tabletop.createRoom}
            joinRoom={tabletop.joinRoom}
          />
        )
        : (
          <GameDashboard
            roomCode={tabletop.roomCode}
            playerId={tabletop.playerId}
            diceHistory={tabletop.diceHistory}
            isRolling={tabletop.isRolling}
            onRollDice={tabletop.rollDice}
            onClearHistory={tabletop.clearDiceHistory}
            onLeave={tabletop.leaveRoom}
          />
        )}
    </div>
  );
}
