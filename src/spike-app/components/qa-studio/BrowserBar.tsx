import { useState } from "react";
import { Search, RotateCcw, Camera, FormInput, AppWindow } from "lucide-react";

interface Props {
  onNavigate: (url: string) => void;
  onRefresh: () => void;
  onScreenshot: () => void;
  onGetForms: () => void;
  onGetTabs: () => void;
  isCalling: boolean;
}

export function BrowserBar({ onNavigate, onRefresh, onScreenshot, onGetForms, onGetTabs, isCalling }: Props) {
  const [url, setUrl] = useState("https://example.com");

  return (
    <div className="flex items-center gap-2 p-2 border-b border-border bg-muted/30">
      <button onClick={onRefresh} disabled={isCalling} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-50" title="Refresh">
        <RotateCcw className="w-4 h-4" />
      </button>
      <div className="flex-1 flex items-center bg-background border border-border rounded px-3 focus-within:ring-1 focus-within:ring-primary">
        <Search className="w-4 h-4 text-muted-foreground mr-2" />
        <input 
          type="text" 
          className="flex-1 py-1.5 text-sm bg-transparent outline-none" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(url); }}
          disabled={isCalling}
          placeholder="Enter a URL to navigate..."
        />
      </div>
      <button onClick={() => onNavigate(url)} disabled={isCalling} className="px-4 py-1.5 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50">
        Go
      </button>
      <div className="h-6 w-px bg-border mx-1"></div>
      <button onClick={onScreenshot} disabled={isCalling} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-50" title="Take Screenshot">
        <Camera className="w-4 h-4" />
      </button>
      <button onClick={onGetForms} disabled={isCalling} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-50" title="Get Forms">
        <FormInput className="w-4 h-4" />
      </button>
      <button onClick={onGetTabs} disabled={isCalling} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-50" title="Get Tabs">
        <AppWindow className="w-4 h-4" />
      </button>
    </div>
  );
}
