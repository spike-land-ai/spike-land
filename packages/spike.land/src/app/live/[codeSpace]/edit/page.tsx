"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface CodespaceData {
  codeSpace: string;
  code: string;
  transpiled?: string;
  html?: string;
  css?: string;
}

export default function CodespacePage() {
  const params = useParams();
  const codeSpace = params.codeSpace as string;

  const [_data, setData] = useState<CodespaceData | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // Fetch initial code
  useEffect(() => {
    async function fetchCode() {
      try {
        setLoading(true);
        const res = await fetch(`/api/live/${codeSpace}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Codespace not found");
          } else {
            setError("Failed to fetch code");
          }
          return;
        }
        const responseData = await res.json();
        setData(responseData);
        setCode(responseData.code || "");
      } catch (error) {
        // Network error or server unavailable
        logger.error("Failed to connect to server", error);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchCode();
  }, [codeSpace]);

  // Sync function
  const syncCode = useCallback(
    async (codeToSync: string) => {
      setSyncing(true);
      try {
        const res = await fetch(`/api/live/${codeSpace}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: codeToSync }),
        });
        if (res.ok) {
          setLastSynced(new Date());
          setHasUnsavedChanges(false);
          // Reload iframe to show changes
          setIframeKey(prev => prev + 1);
        }
      } finally {
        setSyncing(false);
      }
    },
    [codeSpace],
  );

  // Debounced sync - schedules a sync after 1 second of no changes
  const scheduleDebouncedSync = useCallback(
    (newCode: string) => {
      // Clear existing timer
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      // Schedule new sync
      syncTimerRef.current = setTimeout(() => {
        syncCode(newCode);
      }, 1000);
    },
    [syncCode],
  );

  // Handle code change
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setHasUnsavedChanges(true);
    scheduleDebouncedSync(newCode);
  };

  // Manual save
  const handleManualSave = async () => {
    // Clear any pending debounced sync
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    await syncCode(code);
  };

  // Refresh preview
  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleManualSave();
    }
    // Tab for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newCode = code.substring(0, start) + "  " + code.substring(end);
        setCode(newCode);
        setHasUnsavedChanges(true);
        // Reset cursor position
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="grid h-[calc(100dvh-2rem)] grid-cols-2 gap-4">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Codespace: {codeSpace}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">
            /live/{codeSpace}
          </h1>
          <span className="text-sm text-muted-foreground">index.tsx</span>
        </div>
        <div className="flex items-center gap-4">
          {hasUnsavedChanges && <span className="text-sm text-yellow-500">Unsaved changes</span>}
          {syncing && <span className="text-sm text-blue-500">Syncing...</span>}
          {lastSynced && !syncing && (
            <span className="text-xs text-muted-foreground">
              Last synced: {lastSynced.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={syncing}
          >
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            Refresh Preview
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid h-[calc(100dvh-3.5rem)] grid-cols-2">
        {/* Editor Panel */}
        <div className="flex flex-col border-r">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
            <span className="text-sm font-medium">Editor</span>
            <span className="text-xs text-muted-foreground">
              {code.split("\n").length} lines
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none bg-zinc-950 p-4 font-mono text-sm text-zinc-100 focus:outline-none"
            spellCheck={false}
            placeholder="// Write your React code here..."
          />
        </div>

        {/* Preview Panel */}
        <div className="flex flex-col bg-zinc-950">
          {/* Browser Toolbar */}
          <div className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/20 hover:bg-red-500 transition-colors" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/20 hover:bg-yellow-500 transition-colors" />
              <div className="h-3 w-3 rounded-full bg-green-500/20 hover:bg-green-500 transition-colors" />
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="flex w-full max-w-sm items-center gap-2 rounded-md bg-zinc-950/50 px-3 py-1.5 text-xs text-zinc-500">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>spike.land/live/{codeSpace}/</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
              onClick={handleRefresh}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
                <path d="M3 3v9h9" />
              </svg>
            </Button>
          </div>

          {/* iframe Preview */}
          <div className="flex-1 relative">
            <iframe
              key={iframeKey}
              src={`/live/${codeSpace}/`}
              className="absolute inset-0 border-0"
              style={{
                width: "200%",
                height: "200%",
                transform: "scale(0.5)",
                transformOrigin: "0 0",
              }}
              title={`Preview of ${codeSpace}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              allow="autoplay"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
