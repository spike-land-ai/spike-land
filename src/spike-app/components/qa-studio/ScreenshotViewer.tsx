import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface Props {
  base64Data?: string;
}

export function ScreenshotViewer({ base64Data }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!base64Data) {
    return <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">No screenshot available.<br/>Click the camera icon to capture.</div>;
  }
  
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col p-4">
        <div className="flex justify-end mb-4">
          <button onClick={() => setFullscreen(false)} className="p-2 bg-muted rounded-full hover:bg-muted/80">
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <img src={`data:image/png;base64,${base64Data}`} alt="Screenshot" className="max-w-full border shadow-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-muted/20 flex items-center justify-center overflow-auto group">
      <button 
        onClick={() => setFullscreen(true)} 
        className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      <img src={`data:image/png;base64,${base64Data}`} alt="Screenshot" className="max-w-full border shadow-sm" />
    </div>
  );
}
