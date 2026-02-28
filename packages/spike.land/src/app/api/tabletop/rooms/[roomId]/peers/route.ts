import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// In-memory peer registry with automatic cleanup
// In production, this should be replaced with Redis or similar
interface PeerEntry {
  peerId: string;
  lastSeen: number;
}

interface RoomPeers {
  [roomId: string]: Map<string, PeerEntry>;
}

// Global registry (survives between requests in dev, but resets on deploy)
const roomPeers: RoomPeers = {};

// Peer timeout - consider peer disconnected after 30 seconds without heartbeat
const PEER_TIMEOUT_MS = 30000;

// Note: Cleanup happens on each request. For production with high traffic,
// consider a background cleanup job with interval like 10000ms.

// Cleanup stale peers from a room
function cleanupStalePeers(roomId: string): void {
  const peers = roomPeers[roomId];
  if (!peers) return;

  const now = Date.now();
  const staleIds: string[] = [];

  peers.forEach((entry, peerId) => {
    if (now - entry.lastSeen > PEER_TIMEOUT_MS) {
      staleIds.push(peerId);
    }
  });

  staleIds.forEach(id => peers.delete(id));

  // Remove empty rooms
  if (peers.size === 0) {
    delete roomPeers[roomId];
  }
}

// Register or update a peer in a room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; }>; },
): Promise<NextResponse> {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { peerId } = body;

    if (!peerId || typeof peerId !== "string") {
      return NextResponse.json(
        { error: "peerId is required" },
        { status: 400 },
      );
    }

    // Initialize room if needed
    if (!roomPeers[roomId]) {
      roomPeers[roomId] = new Map();
    }

    // Register/update peer
    roomPeers[roomId].set(peerId, {
      peerId,
      lastSeen: Date.now(),
    });

    // Cleanup stale peers
    cleanupStalePeers(roomId);

    // Return list of other peers in the room
    const otherPeers = Array.from(roomPeers[roomId].values())
      .filter(entry => entry.peerId !== peerId)
      .map(entry => entry.peerId);

    return NextResponse.json({
      success: true,
      peers: otherPeers,
      roomId,
    });
  } catch (error) {
    logger.error("[Tabletop API] Error registering peer:", error);
    return NextResponse.json(
      { error: "Failed to register peer" },
      { status: 500 },
    );
  }
}

// Get all peers in a room
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string; }>; },
): Promise<NextResponse> {
  try {
    const { roomId } = await params;

    // Cleanup stale peers first
    cleanupStalePeers(roomId);

    const peers = roomPeers[roomId];
    if (!peers) {
      return NextResponse.json({ peers: [], roomId });
    }

    const peerList = Array.from(peers.values()).map(entry => entry.peerId);

    return NextResponse.json({
      peers: peerList,
      roomId,
    });
  } catch (error) {
    logger.error("[Tabletop API] Error getting peers:", error);
    return NextResponse.json(
      { error: "Failed to get peers" },
      { status: 500 },
    );
  }
}

// Remove a peer from a room (called on disconnect)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; }>; },
): Promise<NextResponse> {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const peerId = searchParams.get("peerId");

    if (!peerId) {
      return NextResponse.json(
        { error: "peerId query parameter is required" },
        { status: 400 },
      );
    }

    const peers = roomPeers[roomId];
    if (peers) {
      peers.delete(peerId);

      // Remove empty rooms
      if (peers.size === 0) {
        delete roomPeers[roomId];
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[Tabletop API] Error removing peer:", error);
    return NextResponse.json(
      { error: "Failed to remove peer" },
      { status: 500 },
    );
  }
}
