"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import { useCallback } from "react";

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface TurnCredentialsResponse {
  iceServers: IceServer[];
}

const FALLBACK_ICE_SERVERS: IceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/**
 * MCP wrapper for the Display app.
 * Provides MCP-backed ICE server fetching to replace direct API calls.
 */
export function useDisplayMcp() {
  const turnCredentialsMutation = useMcpMutation<TurnCredentialsResponse>(
    "display_get_turn_credentials",
  );

  const fetchIceServers = useCallback(async (): Promise<IceServer[]> => {
    try {
      const data = await turnCredentialsMutation.mutateAsync({});
      return data?.iceServers ?? FALLBACK_ICE_SERVERS;
    } catch {
      return FALLBACK_ICE_SERVERS;
    }
  }, [turnCredentialsMutation]);

  return {
    fetchIceServers,
    isLoadingCredentials: turnCredentialsMutation.isLoading,
    credentialsError: turnCredentialsMutation.error,
    resetCredentials: turnCredentialsMutation.reset,
  };
}
