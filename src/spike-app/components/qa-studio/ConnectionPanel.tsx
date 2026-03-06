import { useState } from "react";

interface Props {
  url: string;
  connected: boolean;
  onConnect: (url: string) => void;
  onDisconnect: () => void;
}

export function ConnectionPanel({ url, connected, onConnect, onDisconnect }: Props) {
  const [inputUrl, setInputUrl] = useState(url);

  return (
    <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm font-medium">{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <input
        type="text"
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        className="flex-1 px-3 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="http://localhost:3100/mcp"
        disabled={connected}
      />
      {connected ? (
        <button onClick={onDisconnect} className="px-4 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90">Disconnect</button>
      ) : (
        <button onClick={() => onConnect(inputUrl)} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">Connect</button>
      )}
      {!connected && (
        <div className="text-xs text-muted-foreground ml-2">
          Run <code className="bg-muted px-1 py-0.5 rounded">npx @spike-land-ai/qa-studio --http</code> locally.
        </div>
      )}
    </div>
  );
}
