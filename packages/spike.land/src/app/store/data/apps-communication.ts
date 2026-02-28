import { getAppMcpUrl, type StoreApp } from "./types";

export const COMMUNICATION_APPS: StoreApp[] = [
  // ─── 9. Tabletop Sim ──────────────────────────────────────────────
  {
    id: "tabletop-sim",
    slug: "tabletop-sim",
    name: "Tabletop Sim",
    tagline: "Virtual tabletop for games",
    description: "Play board games and RPGs online with friends on a shared virtual table.",
    longDescription:
      "For tabletop gamers who play remotely. Create game rooms, roll dice, move pieces on custom maps, and talk over built-in voice chat. Supports classic board games, card games, and tabletop RPGs with fog-of-war and custom assets.",
    category: "communication",
    cardVariant: "pink",
    icon: "Gamepad2",
    appUrl: "/apps/tabletop-simulator",
    mcpServerUrl: getAppMcpUrl("tabletop-sim"),
    codespaceId: "storeTabletop",
    isCodespaceNative: true,
    isFeatured: false,
    isFirstParty: true,
    toolCount: 9,
    tags: ["board-games", "rpg", "multiplayer", "voice-chat"],
    color: "pink",
    mcpTools: [
      {
        name: "create_room",
        category: "tabletop",
        description: "Create a new game room with a selected game template and invite link",
      },
      {
        name: "join_room",
        category: "tabletop",
        description: "Join an existing game room using a room code or invite link",
      },
      {
        name: "roll_dice",
        category: "tabletop",
        description: "Roll dice with configurable sides, count, and modifier expressions",
      },
      {
        name: "move_piece",
        category: "tabletop",
        description: "Move a game piece to a new position on the board grid",
      },
      {
        name: "tabletop_save_game",
        category: "tabletop-state",
        description: "Save the current game state with a custom label",
      },
      {
        name: "tabletop_load_game",
        category: "tabletop-state",
        description: "Load a previously saved game state",
      },
      {
        name: "tabletop_list_saves",
        category: "tabletop-state",
        description: "List all saved game states for a room",
      },
      {
        name: "tabletop_send_chat",
        category: "tabletop-state",
        description: "Send a chat message in the game room",
      },
      {
        name: "tabletop_add_asset",
        category: "tabletop-state",
        description: "Add a custom asset (image, token, map) to the game board",
      },
    ],
    features: [
      {
        title: "Multiplayer",
        description: "Real-time game rooms with instant sync",
        icon: "Users",
      },
      {
        title: "Board Games",
        description: "Chess, checkers, and dozens of classic board games",
        icon: "Gamepad2",
      },
      {
        title: "Voice Chat",
        description: "Built-in voice chat during gameplay",
        icon: "Mic",
      },
      {
        title: "Custom Maps",
        description: "Upload custom maps, tokens, and tiles for RPGs",
        icon: "Map",
      },
    ],
  },

  // ─── 15. Chess Arena ─────────────────────────────────────────────
  {
    id: "chess-arena",
    slug: "chess-arena",
    name: "Chess Arena",
    tagline: "Multiplayer chess with ELO",
    description: "Play real-time chess with timed controls, ELO ratings, and move-by-move replay.",
    longDescription:
      "For chess players who want competitive online play. Create profiles, challenge friends, choose time controls from bullet to classical, and track your rating on the leaderboard. Every game is replayable move-by-move.",
    category: "communication",
    cardVariant: "purple",
    icon: "Crown",
    appUrl: "/apps/chess-arena",
    mcpServerUrl: getAppMcpUrl("chess-arena"),
    isFeatured: false,
    isFirstParty: true,
    toolCount: 26,
    tags: ["chess", "multiplayer", "elo", "game-replay", "real-time"],
    color: "purple",
    mcpTools: [
      {
        name: "chess_create_game",
        category: "chess-game",
        description: "Create a new chess game with configurable time controls",
      },
      {
        name: "chess_join_game",
        category: "chess-game",
        description: "Join an existing game as the black player",
      },
      {
        name: "chess_make_move",
        category: "chess-game",
        description: "Make a move in an active chess game",
      },
      {
        name: "chess_get_game",
        category: "chess-game",
        description: "Get the current state of a chess game with move history",
      },
      {
        name: "chess_list_games",
        category: "chess-game",
        description: "List your chess games with optional status filter",
      },
      {
        name: "chess_resign",
        category: "chess-game",
        description: "Resign from an active chess game",
      },
      {
        name: "chess_offer_draw",
        category: "chess-game",
        description: "Offer a draw to your opponent in an active game",
      },
      {
        name: "chess_accept_draw",
        category: "chess-game",
        description: "Accept a draw offer from your opponent",
      },
      {
        name: "chess_create_player",
        category: "chess-player",
        description: "Create a new chess player profile with name and avatar",
      },
      {
        name: "chess_get_player",
        category: "chess-player",
        description: "Get a chess player profile by ID",
      },
      {
        name: "chess_list_profiles",
        category: "chess-player",
        description: "List all your chess player profiles",
      },
      {
        name: "chess_update_player",
        category: "chess-player",
        description: "Update your player profile name, avatar, or sound settings",
      },
      {
        name: "chess_get_stats",
        category: "chess-player",
        description: "Get detailed statistics for a chess player",
      },
      {
        name: "chess_list_online",
        category: "chess-player",
        description: "List all online chess players in the lobby",
      },
      {
        name: "chess_send_challenge",
        category: "chess-challenge",
        description: "Send a challenge to another player with optional time control",
      },
      {
        name: "chess_accept_challenge",
        category: "chess-challenge",
        description: "Accept an incoming chess challenge",
      },
      {
        name: "chess_decline_challenge",
        category: "chess-challenge",
        description: "Decline an incoming chess challenge",
      },
      {
        name: "chess_cancel_challenge",
        category: "chess-challenge",
        description: "Cancel a challenge you sent",
      },
      {
        name: "chess_list_challenges",
        category: "chess-challenge",
        description: "List your pending chess challenges",
      },
      {
        name: "chess_replay_game",
        category: "chess-replay",
        description: "Get the full move-by-move replay of a completed game",
      },
      {
        name: "chess_get_leaderboard",
        category: "chess-replay",
        description: "Get the top chess players ranked by ELO rating",
      },
      {
        name: "chess_create_tournament",
        category: "chess-tournament",
        description: "Create a new chess tournament with format, time control, and player cap",
      },
      {
        name: "chess_join_tournament",
        category: "chess-tournament",
        description: "Join an open tournament by ID and get your seeding position",
      },
      {
        name: "chess_get_tournament",
        category: "chess-tournament",
        description: "Get full tournament state: standings, pairings, and completed games",
      },
      {
        name: "chess_list_tournaments",
        category: "chess-tournament",
        description: "List tournaments filtered by status",
      },
      {
        name: "chess_get_puzzle",
        category: "chess-tournament",
        description: "Get a chess puzzle filtered by difficulty and tactical theme",
      },
    ],
    features: [
      {
        title: "Real-Time Multiplayer",
        description: "Challenge friends and play live with instant sync",
        icon: "Users",
      },
      {
        title: "ELO Rating System",
        description: "ELO rating updates after every game",
        icon: "Trophy",
      },
      {
        title: "Time Controls",
        description: "Bullet, blitz, rapid, classical, or unlimited",
        icon: "Clock",
      },
      {
        title: "Game Replay",
        description: "Review completed games move-by-move",
        icon: "RotateCcw",
      },
    ],
  },
];
