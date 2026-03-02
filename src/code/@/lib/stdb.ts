/**
 * SpacetimeDB connection for code editor.
 *
 * Uses the native HTTP client instead of the spacetimedb SDK.
 * Real-time WebSocket subscription replaced with HTTP polling stub.
 */

import { createStdbHttpClient, type StdbHttpClient } from "@spike-land-ai/spacetimedb-platform/stdb-http-client";

const isDev = typeof window !== "undefined"
  && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
export const STDB_URL = isDev ? "http://localhost:3000" : "https://api.spike.land/spacetimedb";
export const STDB_MODULE = "rightful-dirt-5033";

let stdbClient: StdbHttpClient | null = null;
let isConnecting = false;
const connectionListeners: Array<(client: StdbHttpClient) => void> = [];

export function getStdbClient() {
  return stdbClient;
}

export function onStdbConnect(cb: (client: StdbHttpClient) => void) {
  if (stdbClient) {
    cb(stdbClient);
  } else {
    connectionListeners.push(cb);
  }
}

export function connectToSpacetimeDB() {
  if (stdbClient || isConnecting) {
    return;
  }
  isConnecting = true;

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("stdb_token") || undefined : undefined;

  const client = createStdbHttpClient({
    host: STDB_URL,
    database: STDB_MODULE,
    token,
  });

  // Verify connectivity
  client.sql("SELECT 1").then(() => {
    console.log("Connected to SpacetimeDB via HTTP");
    stdbClient = client;
    isConnecting = false;
    connectionListeners.forEach((cb) => cb(client));
  }).catch((err: unknown) => {
    console.error("SpacetimeDB connection error:", err);
    isConnecting = false;
  });
}
