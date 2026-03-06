import { useState } from "react";
import { ScreenshotViewer } from "./ScreenshotViewer";

interface Props {
  screenshotData?: string;
  tabsData?: unknown;
  formsData?: unknown;
}

export function SidePanel({ screenshotData, tabsData, formsData }: Props) {
  const [activeTab, setActiveTab] = useState<"screenshot" | "forms" | "tabs">("screenshot");

  return (
    <div className="flex flex-col h-full border-l border-border bg-card">
      <div className="flex items-center border-b border-border bg-muted/30">
        <button 
          onClick={() => setActiveTab("screenshot")} 
          className={`flex-1 p-2 text-sm font-medium ${activeTab === "screenshot" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
        >
          Screenshot
        </button>
        <button 
          onClick={() => setActiveTab("forms")} 
          className={`flex-1 p-2 text-sm font-medium ${activeTab === "forms" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
        >
          Forms
        </button>
        <button 
          onClick={() => setActiveTab("tabs")} 
          className={`flex-1 p-2 text-sm font-medium ${activeTab === "tabs" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
        >
          Tabs
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "screenshot" && <ScreenshotViewer {...(screenshotData !== undefined ? { base64Data: screenshotData } : {})} />}
        {activeTab === "forms" && (
          <div className="p-4 h-full overflow-auto bg-muted/10">
            {formsData ? (
              <pre className="text-xs font-mono bg-muted p-3 rounded border border-border whitespace-pre-wrap break-all">
                {JSON.stringify(formsData, null, 2)}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No forms data available.
              </div>
            )}
          </div>
        )}
        {activeTab === "tabs" && (
          <div className="p-4 h-full overflow-auto bg-muted/10">
            {tabsData ? (
              <pre className="text-xs font-mono bg-muted p-3 rounded border border-border whitespace-pre-wrap break-all">
                {JSON.stringify(tabsData, null, 2)}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No tabs data available.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
