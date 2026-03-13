import type {
  PKGNode,
  PKGEdge,
  PKGEventLogEntry,
  PKGQueryResult,
  PKGNodeType,
  PKGEdgeType,
} from "../core-logic/types.js";

// --- Row types for D1 result mapping ---
interface PKGNodeRow {
  id: string;
  user_id: string;
  node_type: string;
  label: string;
  data_json: string;
  confidence: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

interface PKGEdgeRow {
  id: string;
  user_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  weight: number;
  metadata_json: string;
  created_at: number;
  updated_at: number;
}

function rowToNode(row: PKGNodeRow): PKGNode {
  return {
    id: row.id,
    userId: row.user_id,
    nodeType: row.node_type as PKGNodeType,
    label: row.label,
    dataJson: JSON.parse(row.data_json || "{}") as Record<string, unknown>,
    confidence: row.confidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function rowToEdge(row: PKGEdgeRow): PKGEdge {
  return {
    id: row.id,
    userId: row.user_id,
    sourceNodeId: row.source_node_id,
    targetNodeId: row.target_node_id,
    edgeType: row.edge_type as PKGEdgeType,
    weight: row.weight,
    metadata: JSON.parse(row.metadata_json || "{}") as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function addNode(
  db: D1Database,
  node: Omit<PKGNode, "createdAt" | "updatedAt" | "deletedAt">,
): Promise<void> {
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO pkg_nodes (id, user_id, node_type, label, data_json, confidence, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET
         label = excluded.label,
         data_json = excluded.data_json,
         confidence = excluded.confidence,
         updated_at = excluded.updated_at,
         deleted_at = NULL`,
    )
    .bind(
      node.id,
      node.userId,
      node.nodeType,
      node.label,
      JSON.stringify(node.dataJson),
      node.confidence,
      now,
      now,
    )
    .run();
}

export async function addEdge(
  db: D1Database,
  edge: Omit<PKGEdge, "createdAt" | "updatedAt">,
): Promise<void> {
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO pkg_edges (id, user_id, source_node_id, target_node_id, edge_type, weight, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         weight = excluded.weight,
         metadata_json = excluded.metadata_json,
         updated_at = excluded.updated_at`,
    )
    .bind(
      edge.id,
      edge.userId,
      edge.sourceNodeId,
      edge.targetNodeId,
      edge.edgeType,
      edge.weight,
      JSON.stringify(edge.metadata),
      now,
      now,
    )
    .run();
}

export async function queryNodes(
  db: D1Database,
  userId: string,
  opts?: { nodeType?: PKGNodeType; minConfidence?: number; limit?: number },
): Promise<PKGNode[]> {
  let sql = "SELECT * FROM pkg_nodes WHERE user_id = ? AND deleted_at IS NULL";
  const bindings: unknown[] = [userId];

  if (opts?.nodeType) {
    sql += " AND node_type = ?";
    bindings.push(opts.nodeType);
  }
  if (opts?.minConfidence !== undefined) {
    sql += " AND confidence >= ?";
    bindings.push(opts.minConfidence);
  }

  sql += " ORDER BY confidence DESC, updated_at DESC";

  if (opts?.limit) {
    sql += " LIMIT ?";
    bindings.push(opts.limit);
  }

  const result = await db
    .prepare(sql)
    .bind(...bindings)
    .all<PKGNodeRow>();
  return (result.results ?? []).map(rowToNode);
}

export async function queryEdges(
  db: D1Database,
  userId: string,
  opts?: { edgeType?: PKGEdgeType; sourceNodeId?: string; targetNodeId?: string },
): Promise<PKGEdge[]> {
  let sql = "SELECT * FROM pkg_edges WHERE user_id = ?";
  const bindings: unknown[] = [userId];

  if (opts?.edgeType) {
    sql += " AND edge_type = ?";
    bindings.push(opts.edgeType);
  }
  if (opts?.sourceNodeId) {
    sql += " AND source_node_id = ?";
    bindings.push(opts.sourceNodeId);
  }
  if (opts?.targetNodeId) {
    sql += " AND target_node_id = ?";
    bindings.push(opts.targetNodeId);
  }

  sql += " ORDER BY weight DESC, updated_at DESC";

  const result = await db
    .prepare(sql)
    .bind(...bindings)
    .all<PKGEdgeRow>();
  return (result.results ?? []).map(rowToEdge);
}

export async function getConnectedNodes(
  db: D1Database,
  userId: string,
  nodeId: string,
): Promise<PKGQueryResult> {
  const [outEdges, inEdges] = await Promise.all([
    queryEdges(db, userId, { sourceNodeId: nodeId }),
    queryEdges(db, userId, { targetNodeId: nodeId }),
  ]);

  const allEdges = [...outEdges, ...inEdges];
  const connectedNodeIds = new Set<string>();
  for (const edge of allEdges) {
    if (edge.sourceNodeId !== nodeId) connectedNodeIds.add(edge.sourceNodeId);
    if (edge.targetNodeId !== nodeId) connectedNodeIds.add(edge.targetNodeId);
  }

  if (connectedNodeIds.size === 0) {
    return { nodes: [], edges: allEdges };
  }

  // Fetch connected nodes
  const placeholders = [...connectedNodeIds].map(() => "?").join(", ");
  const result = await db
    .prepare(
      `SELECT * FROM pkg_nodes WHERE user_id = ? AND id IN (${placeholders}) AND deleted_at IS NULL`,
    )
    .bind(userId, ...connectedNodeIds)
    .all<PKGNodeRow>();

  return {
    nodes: (result.results ?? []).map(rowToNode),
    edges: allEdges,
  };
}

export async function softDeleteNode(
  db: D1Database,
  userId: string,
  nodeId: string,
): Promise<void> {
  const now = Date.now();
  await db
    .prepare("UPDATE pkg_nodes SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?")
    .bind(now, now, nodeId, userId)
    .run();
}

export async function temporalQuery(
  db: D1Database,
  userId: string,
  nodeId: string,
  opts?: { since?: number; until?: number },
): Promise<PKGEventLogEntry[]> {
  let sql = "SELECT * FROM pkg_event_log WHERE user_id = ? AND node_id = ?";
  const bindings: unknown[] = [userId, nodeId];

  if (opts?.since) {
    sql += " AND created_at >= ?";
    bindings.push(opts.since);
  }
  if (opts?.until) {
    sql += " AND created_at <= ?";
    bindings.push(opts.until);
  }

  sql += " ORDER BY created_at DESC";

  const result = await db
    .prepare(sql)
    .bind(...bindings)
    .all<{
      id: string;
      user_id: string;
      node_id: string;
      event_type: string;
      snapshot_json: string;
      created_at: number;
    }>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    nodeId: row.node_id,
    eventType: row.event_type,
    snapshotJson: JSON.parse(row.snapshot_json || "{}") as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}

export async function appendEventLog(
  db: D1Database,
  entry: Omit<PKGEventLogEntry, "createdAt">,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO pkg_event_log (id, user_id, node_id, event_type, snapshot_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      entry.id,
      entry.userId,
      entry.nodeId,
      entry.eventType,
      JSON.stringify(entry.snapshotJson),
      Date.now(),
    )
    .run();
}
