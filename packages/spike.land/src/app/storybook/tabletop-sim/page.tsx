"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { GameRoomCard } from "@/components/tabletop-sim/GameRoomCard";
import { DiceRollerWidget } from "@/components/tabletop-sim/DiceRollerWidget";
import { PlayerAvatar } from "@/components/tabletop-sim/PlayerAvatar";
import { GameBoardPlaceholder } from "@/components/tabletop-sim/GameBoardPlaceholder";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockRooms = [
  {
    roomId: "a1b2",
    gameName: "Dungeon Delve",
    players: [
      { name: "Zoltan", avatarInitials: "ZE", color: "#6366f1" },
      { name: "NovaStar", avatarInitials: "NS", color: "#ec4899" },
      { name: "PixelForge", avatarInitials: "PF", color: "#f59e0b" },
    ],
    maxPlayers: 4,
    status: "waiting" as const,
    gameType: "RPG",
  },
  {
    roomId: "c3d4",
    gameName: "Hex Wars",
    players: [
      { name: "ByteQueen", avatarInitials: "BQ", color: "#10b981" },
      { name: "CodeAlchemist", avatarInitials: "CA", color: "#3b82f6" },
    ],
    maxPlayers: 2,
    status: "in-progress" as const,
    gameType: "Strategy",
  },
  {
    roomId: "e5f6",
    gameName: "Card Conquest",
    players: [
      { name: "SyntaxSamurai", avatarInitials: "SS", color: "#8b5cf6" },
      { name: "NovaStar", avatarInitials: "NS", color: "#ec4899" },
      { name: "PixelForge", avatarInitials: "PF", color: "#f59e0b" },
    ],
    maxPlayers: 3,
    status: "finished" as const,
    gameType: "Card Game",
  },
];

const mockPlayers = [
  {
    username: "NovaStar",
    initials: "NS",
    color: "#ec4899",
    isActive: true,
    role: "Game Master",
  },
  {
    username: "PixelForge",
    initials: "PF",
    color: "#f59e0b",
    isActive: true,
    role: "Warrior",
  },
  {
    username: "ByteQueen",
    initials: "BQ",
    color: "#10b981",
    isActive: false,
    role: "Mage",
  },
  {
    username: "CodeAlchemist",
    initials: "CA",
    color: "#3b82f6",
    isActive: false,
    role: "Rogue",
  },
];

const mockPieces = [
  { row: 1, col: 1, symbol: "K", color: "#f8fafc", label: "White King" },
  { row: 0, col: 4, symbol: "Q", color: "#f8fafc", label: "White Queen" },
  { row: 6, col: 3, symbol: "K", color: "#1e293b", label: "Black King" },
  { row: 7, col: 2, symbol: "R", color: "#1e293b", label: "Black Rook" },
  { row: 3, col: 3, symbol: "P", color: "#6366f1", label: "Purple Pawn" },
  { row: 4, col: 5, symbol: "N", color: "#ec4899", label: "Pink Knight" },
];

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const codeSnippets = {
  gameRoomCard: `import { GameRoomCard } from "@/components/tabletop-sim/GameRoomCard";

<GameRoomCard
  roomId="a1b2"
  gameName="Dungeon Delve"
  players={[
    { name: "Zoltan", avatarInitials: "ZE", color: "#6366f1" },
    { name: "NovaStar", avatarInitials: "NS", color: "#ec4899" },
  ]}
  maxPlayers={4}
  status="waiting"
  gameType="RPG"
/>`,
  diceRoller: `import { DiceRollerWidget } from "@/components/tabletop-sim/DiceRollerWidget";

<DiceRollerWidget selectedDie={20} lastResult={17} />`,
  playerAvatar: `import { PlayerAvatar } from "@/components/tabletop-sim/PlayerAvatar";

<PlayerAvatar
  username="NovaStar"
  initials="NS"
  color="#ec4899"
  isActive={true}
  role="Game Master"
/>`,
  gameBoard: `import { GameBoardPlaceholder } from "@/components/tabletop-sim/GameBoardPlaceholder";

<GameBoardPlaceholder
  gridSize={8}
  pieces={[
    { row: 1, col: 1, symbol: "K", color: "#f8fafc", label: "White King" },
    { row: 6, col: 3, symbol: "K", color: "#1e293b", label: "Black King" },
  ]}
/>`,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TabletopSimPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Tabletop Simulator"
        description="Components for the virtual tabletop simulator — room lobbies, dice rolling, player avatars, and configurable game boards. Supports RPGs, strategy games, card games, and any grid-based tabletop experience."
        usage="Use these components to build tabletop game lobby screens, in-game HUDs, and board visualizations. GameRoomCard handles discovery and joining; DiceRollerWidget manages its own state."
      />

      <UsageGuide
        dos={[
          "Use GameRoomCard in a grid layout for room browsing.",
          "Let DiceRollerWidget manage its own selected die state — only pass initialDie for seeded defaults.",
          "Use PlayerAvatar with isActive to distinguish online vs offline players.",
          "Use GameBoardPlaceholder for previewing static board states before full game engine integration.",
          "Show player count alongside empty slots to communicate capacity clearly.",
        ]}
        donts={[
          "Don't show a Join button as enabled when a game is in-progress or the room is full.",
          "Avoid placing pieces outside the gridSize bounds — they will not render.",
          "Don't use GameBoardPlaceholder as a real-time game engine — it's a display-only placeholder.",
          "Avoid assigning the same color to multiple players in the same room.",
          "Don't rely on avatarInitials alone — always include the full username for accessibility.",
        ]}
      />

      {/* Game Room Cards */}
      <ComponentSample
        title="Game Room Cards"
        description="Lobby cards for active and pending game rooms. Shows game type badge, status indicator, player avatars with open slot indicators, player count, and a context-sensitive action button."
        code={codeSnippets.gameRoomCard}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {mockRooms.map(room => (
            <GameRoomCard
              key={room.roomId}
              roomId={room.roomId}
              gameName={room.gameName}
              players={room.players}
              maxPlayers={room.maxPlayers}
              status={room.status}
              gameType={room.gameType}
            />
          ))}
        </div>
      </ComponentSample>

      {/* Dice Roller */}
      <ComponentSample
        title="Dice Roller Widget"
        description="Interactive dice selector and roller. Supports d4, d6, d8, d10, d12, and d20. Highlights the selected die, shows the last roll result prominently, and manages its own state."
        code={codeSnippets.diceRoller}
      >
        <div className="flex flex-wrap gap-6 justify-center">
          <DiceRollerWidget />
          <DiceRollerWidget selectedDie={20} lastResult={17} />
        </div>
      </ComponentSample>

      {/* Player Avatars */}
      <ComponentSample
        title="Player Avatars"
        description="Round colored avatars with username and optional role label. An active indicator dot distinguishes online players from offline ones."
        code={codeSnippets.playerAvatar}
      >
        <div className="flex flex-wrap gap-8 items-start justify-center">
          {mockPlayers.map(player => (
            <PlayerAvatar
              key={player.username}
              username={player.username}
              initials={player.initials}
              color={player.color}
              isActive={player.isActive}
              role={player.role}
            />
          ))}
        </div>
      </ComponentSample>

      {/* Game Board */}
      <ComponentSample
        title="Game Board Placeholder"
        description="Configurable CSS-grid board with alternating light/dark squares. Pieces are rendered as colored circles with symbols. Use for static board state previews."
        code={codeSnippets.gameBoard}
      >
        <div className="flex flex-col items-center gap-6">
          <GameBoardPlaceholder gridSize={8} pieces={mockPieces} />
          <div className="flex gap-6">
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 text-center">4x4 grid</p>
              <GameBoardPlaceholder
                gridSize={4}
                pieces={[
                  { row: 0, col: 0, symbol: "A", color: "#6366f1", label: "Alpha" },
                  { row: 3, col: 3, symbol: "B", color: "#ec4899", label: "Beta" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 text-center">6x6 grid</p>
              <GameBoardPlaceholder
                gridSize={6}
                pieces={[
                  { row: 2, col: 1, symbol: "X", color: "#f59e0b", label: "X piece" },
                  { row: 3, col: 4, symbol: "O", color: "#10b981", label: "O piece" },
                ]}
              />
            </div>
          </div>
        </div>
      </ComponentSample>

      {/* Code Snippets */}
      <CodePreview
        code={codeSnippets.gameRoomCard}
        title="Tabletop Simulator Components"
        tabs={[
          { label: "GameRoomCard", code: codeSnippets.gameRoomCard },
          { label: "DiceRollerWidget", code: codeSnippets.diceRoller },
          { label: "PlayerAvatar", code: codeSnippets.playerAvatar },
          { label: "GameBoardPlaceholder", code: codeSnippets.gameBoard },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "GameRoomCard Join button is disabled (not just visually hidden) when game is in-progress or finished.",
          "PlayerAvatar uses aria-label on the avatar div for screen reader identification.",
          "Active indicator dot on PlayerAvatar includes an aria-label of 'Active'.",
          "GameBoardPlaceholder uses role='grid' and role='gridcell' for screen reader navigation.",
          "Piece cells include aria-label with piece name and board coordinates.",
          "DiceRollerWidget roll button text updates to 'Rolling...' during animation to convey state.",
          "Status badges in GameRoomCard use both color and text label for colorblind accessibility.",
          "Empty board slots have no aria content — only occupied cells receive descriptive labels.",
          "Player colors should meet 3:1 contrast against the card background for WCAG AA.",
        ]}
      />

      <RelatedComponents currentId="tabletop-sim" />
    </div>
  );
}
