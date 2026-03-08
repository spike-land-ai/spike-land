import { useState, useCallback } from "react";
import { Terminal, Play, Loader2, ChevronRight } from "lucide-react";

interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

interface TerminalSurfaceProps {
  appSlug: string;
  availableTools?: string[];
  className?: string;
}

export function TerminalSurface({ appSlug, availableTools = [], className = "" }: TerminalSurfaceProps) {
  const [history, setHistory] = useState<Array<{
    tool: string;
    input: string;
    output: string;
    isError: boolean;
    timestamp: number;
  }>>([]);
  const [selectedTool, setSelectedTool] = useState(availableTools[0] || "");
  const [inputJson, setInputJson] = useState("{}");
  const [isRunning, setIsRunning] = useState(false);

  const executeTool = useCallback(async () => {
    if (!selectedTool || isRunning) return;
    setIsRunning(true);

    const entry = {
      tool: selectedTool,
      input: inputJson,
      output: "",
      isError: false,
      timestamp: Date.now(),
    };

    try {
      const args = JSON.parse(inputJson);
      const res = await fetch("/mcp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: { name: selectedTool, arguments: args },
          id: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        entry.output = JSON.stringify(data.error, null, 2);
        entry.isError = true;
      } else {
        const result = data.result as ToolResult;
        entry.output = result.content?.map((c: { text: string }) => c.text).join("\n") || JSON.stringify(result, null, 2);
        entry.isError = !!result.isError;
      }
    } catch (err) {
      entry.output = err instanceof Error ? err.message : "Execution failed";
      entry.isError = true;
    }

    setHistory((prev) => [...prev, entry]);
    setIsRunning(false);
  }, [selectedTool, inputJson, isRunning]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      executeTool();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
        <Terminal className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold text-sm">Terminal &mdash; {appSlug}</span>
      </div>

      {/* Output history */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-4">
        {history.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            Select a tool and execute it. Results appear here.
          </p>
        )}
        {history.map((entry, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-1 text-primary">
              <ChevronRight className="w-3 h-3" />
              <span className="font-bold">{entry.tool}</span>
              <span className="text-muted-foreground text-xs ml-2">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground pl-4 truncate">
              {entry.input}
            </div>
            <pre
              className={`pl-4 whitespace-pre-wrap text-xs ${
                entry.isError ? "text-destructive" : "text-foreground/80"
              }`}
            >
              {entry.output}
            </pre>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex gap-2">
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select tool...</option>
            {availableTools.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={executeTool}
            disabled={!selectedTool || isRunning}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-primary-foreground
                       disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-1"
            aria-label="Execute tool"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run
          </button>
        </div>
        <textarea
          value={inputJson}
          onChange={(e) => setInputJson(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='{"key": "value"}'
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2
                     font-mono text-xs placeholder:text-muted-foreground
                     focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-[10px] text-muted-foreground">
          Cmd+Enter to execute
        </p>
      </div>
    </div>
  );
}
