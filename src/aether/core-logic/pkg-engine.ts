import type {
  PKGNode,
  PKGEdge,
  PKGNodeType,
  PKGEdgeType,
  PKGQueryResult,
  PKGEventLogEntry,
} from "./types.js";
import * as pkgDb from "../db/pkg.js";

export interface PKGEngine {
  addNode(node: {
    nodeType: PKGNodeType;
    label: string;
    data?: Record<string, unknown>;
    confidence?: number;
  }): Promise<PKGNode>;

  addEdge(edge: {
    sourceNodeId: string;
    targetNodeId: string;
    edgeType: PKGEdgeType;
    weight?: number;
    metadata?: Record<string, unknown>;
  }): Promise<PKGEdge>;

  query(opts?: {
    nodeType?: PKGNodeType;
    minConfidence?: number;
    limit?: number;
  }): Promise<PKGNode[]>;

  getConnected(nodeId: string): Promise<PKGQueryResult>;

  temporalQuery(
    nodeId: string,
    opts?: {
      since?: number;
      until?: number;
    },
  ): Promise<PKGEventLogEntry[]>;

  softDelete(nodeId: string): Promise<void>;

  suggestConnections(nodeId: string): Promise<
    Array<{
      targetNode: PKGNode;
      suggestedEdgeType: PKGEdgeType;
      reason: string;
    }>
  >;
}

export function createPKGEngine(db: D1Database, userId: string): PKGEngine {
  return {
    async addNode({ nodeType, label, data, confidence }) {
      const id = crypto.randomUUID();
      const node: Omit<PKGNode, "createdAt" | "updatedAt" | "deletedAt"> = {
        id,
        userId,
        nodeType,
        label,
        dataJson: data ?? {},
        confidence: confidence ?? 0.5,
      };
      await pkgDb.addNode(db, node);

      // Log event
      await pkgDb.appendEventLog(db, {
        id: crypto.randomUUID(),
        userId,
        nodeId: id,
        eventType: "created",
        snapshotJson: { nodeType, label, confidence: confidence ?? 0.5 },
      });

      const now = Date.now();
      return { ...node, createdAt: now, updatedAt: now, deletedAt: null };
    },

    async addEdge({ sourceNodeId, targetNodeId, edgeType, weight, metadata }) {
      const id = crypto.randomUUID();
      const edge: Omit<PKGEdge, "createdAt" | "updatedAt"> = {
        id,
        userId,
        sourceNodeId,
        targetNodeId,
        edgeType,
        weight: weight ?? 1.0,
        metadata: metadata ?? {},
      };
      await pkgDb.addEdge(db, edge);
      const now = Date.now();
      return { ...edge, createdAt: now, updatedAt: now };
    },

    async query(opts) {
      return pkgDb.queryNodes(db, userId, opts);
    },

    async getConnected(nodeId) {
      return pkgDb.getConnectedNodes(db, userId, nodeId);
    },

    async temporalQuery(nodeId, opts) {
      return pkgDb.temporalQuery(db, userId, nodeId, opts);
    },

    async softDelete(nodeId) {
      await pkgDb.softDeleteNode(db, userId, nodeId);
      await pkgDb.appendEventLog(db, {
        id: crypto.randomUUID(),
        userId,
        nodeId,
        eventType: "deleted",
        snapshotJson: {},
      });
    },

    async suggestConnections(nodeId) {
      // Get the source node's connected graph
      const { nodes: connected } = await pkgDb.getConnectedNodes(db, userId, nodeId);
      const connectedIds = new Set(connected.map((n) => n.id));
      connectedIds.add(nodeId);

      // Get all user's nodes that aren't already connected
      const allNodes = await pkgDb.queryNodes(db, userId, { limit: 50 });
      const candidates = allNodes.filter((n) => !connectedIds.has(n.id));

      // Simple heuristic: suggest connections based on shared node types and high confidence
      const suggestions: Array<{
        targetNode: PKGNode;
        suggestedEdgeType: PKGEdgeType;
        reason: string;
      }> = [];

      // Get the source node
      const sourceNodes = await pkgDb.queryNodes(db, userId, { limit: 1 });
      const sourceNode =
        sourceNodes.find((n) => n.id === nodeId) ?? allNodes.find((n) => n.id === nodeId);
      if (!sourceNode) return [];

      for (const candidate of candidates.slice(0, 10)) {
        const suggestedEdge = inferEdgeType(sourceNode.nodeType, candidate.nodeType);
        if (suggestedEdge) {
          suggestions.push({
            targetNode: candidate,
            suggestedEdgeType: suggestedEdge.edgeType,
            reason: suggestedEdge.reason,
          });
        }
      }

      return suggestions;
    },
  };
}

function inferEdgeType(
  sourceType: PKGNodeType,
  targetType: PKGNodeType,
): { edgeType: PKGEdgeType; reason: string } | null {
  // Skill → Goal: pursues
  if (sourceType === "skill" && targetType === "goal") {
    return { edgeType: "pursues", reason: "Skill may contribute to goal" };
  }
  // Goal → Skill: pursues (reverse)
  if (sourceType === "goal" && targetType === "skill") {
    return { edgeType: "pursues", reason: "Goal may require this skill" };
  }
  // Decision → Event: caused
  if (sourceType === "decision" && targetType === "event") {
    return { edgeType: "caused", reason: "Decision may have caused this event" };
  }
  // Event → Belief: learned
  if (sourceType === "event" && targetType === "belief") {
    return { edgeType: "learned", reason: "Event may have shaped this belief" };
  }
  // Belief → Decision: holds
  if (sourceType === "belief" && targetType === "decision") {
    return { edgeType: "holds", reason: "Belief may influence this decision" };
  }
  // Health signal → Health signal: correlates
  if (sourceType === "health_signal" && targetType === "health_signal") {
    return { edgeType: "correlates", reason: "Health signals may be correlated" };
  }
  return null;
}
