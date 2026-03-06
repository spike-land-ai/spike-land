import { useState, useEffect, useCallback, useRef } from "react";

export type ToolCallResult = {
  content: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
  isError?: boolean;
};

export type HistoryItem = {
  id: number;
  tool: string;
  args: Record<string, unknown>;
  result?: ToolCallResult;
  error?: string;
  timestamp: number;
  duration?: number;
};

export function useQaStudioMcp() {
  const [url, setUrl] = useState(() => localStorage.getItem("qa-studio-mcp-url") || "http://localhost:3100/mcp");
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isCalling, setIsCalling] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const postUrlRef = useRef<string | null>(null);
  const pendingRequestsRef = useRef<Map<number, { resolve: (val: ToolCallResult) => void; reject: (err: unknown) => void }>>(new Map());
  const nextIdRef = useRef(1);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    postUrlRef.current = null;
    setConnected(false);
  }, []);

  const connect = useCallback((targetUrl: string) => {
    disconnect();
    setUrl(targetUrl);
    localStorage.setItem("qa-studio-mcp-url", targetUrl);

    try {
      const es = new EventSource(targetUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        // SSE connection opened, waiting for endpoint event to be fully connected
      };

      es.onerror = () => {
        console.error("SSE connection error");
        disconnect();
      };

      es.addEventListener("endpoint", (e: MessageEvent) => {
        // The server sends the POST endpoint URL
        postUrlRef.current = targetUrl.replace("/mcp", "") + e.data;
        if (e.data.startsWith("http")) {
          postUrlRef.current = e.data;
        } else if (e.data.startsWith("/")) {
          const urlObj = new URL(targetUrl);
          postUrlRef.current = `${urlObj.origin}${e.data}`;
        }
        
        // Initialize MCP connection
        const initId = nextIdRef.current++;
        const postUrl = postUrlRef.current;
        if (!postUrl) return;
        fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: initId,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: { name: "qa-studio-ui", version: "0.1.0" }
            }
          })
        }).catch(console.error);
        
        pendingRequestsRef.current.set(initId, {
          resolve: () => {
            // Once initialized, send initialized notification
            fetch(postUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "notifications/initialized"
              })
            }).catch(console.error);
            setConnected(true);
          },
          reject: () => {
            disconnect();
          }
        });
      });

      es.addEventListener("message", (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.id !== undefined && pendingRequestsRef.current.has(msg.id)) {
            const { resolve, reject } = pendingRequestsRef.current.get(msg.id)!;
            pendingRequestsRef.current.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        } catch (err) {
          console.error("Error parsing message", err);
        }
      });
    } catch (error) {
      console.error("Failed to connect", error);
      disconnect();
    }
  }, [disconnect]);

  const callTool = useCallback(async (name: string, args: Record<string, unknown>): Promise<ToolCallResult> => {
    if (!connected || !postUrlRef.current) {
      throw new Error("Not connected");
    }

    setIsCalling(true);
    const id = nextIdRef.current++;
    const startTime = Date.now();
    
    const historyItem: HistoryItem = {
      id,
      tool: name,
      args,
      timestamp: startTime,
    };
    
    setHistory(prev => [historyItem, ...prev]);

    return new Promise<ToolCallResult>((resolve, reject) => {
      pendingRequestsRef.current.set(id, {
        resolve: (result) => {
          const duration = Date.now() - startTime;
          setHistory(prev => prev.map(item =>
            item.id === id ? { ...item, result: result as ToolCallResult, duration } : item
          ));
          setIsCalling(false);
          resolve(result as ToolCallResult);
        },
        reject: (error) => {
          const duration = Date.now() - startTime;
          setHistory(prev => prev.map(item => 
            item.id === id ? { ...item, error: typeof error === 'string' ? error : (error instanceof Error ? error.message : "Unknown error"), duration } : item
          ));
          setIsCalling(false);
          reject(error);
        }
      });

      const postUrl = postUrlRef.current;
      if (!postUrl) {
        const p = pendingRequestsRef.current.get(id);
        pendingRequestsRef.current.delete(id);
        p?.reject(new Error("Not connected"));
        return;
      }
      fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id,
          method: "tools/call",
          params: { name, arguments: args }
        })
      }).catch(err => {
        if (pendingRequestsRef.current.has(id)) {
          const p = pendingRequestsRef.current.get(id);
          pendingRequestsRef.current.delete(id);
          p?.reject(err);
        }
      });
    });
  }, [connected]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    url,
    connected,
    history,
    isCalling,
    connect,
    disconnect,
    callTool
  };
}
