import React, { useState, useEffect, useRef } from "react";

interface Props {
  rawPrd: string;
  variants: Record<string, string>;
  slug: string;
}

export default function PersonaBlogViewer({ rawPrd, variants, slug }: Props) {
  const [persona, setPersona] = useState<string>("ai-indie");
  const [hasSeenGeneration, setHasSeenGeneration] = useState<boolean>(true); // Default true to avoid hydration mismatch
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [displayedContent, setDisplayedContent] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Read persona from cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const savedPersona = getCookie("spike-persona");
    const activePersona = savedPersona && variants[savedPersona] ? savedPersona : "ai-indie";
    setPersona(activePersona);

    const targetContent = variants[activePersona] || rawPrd;

    // Check if user has seen generation for this post
    const storageKey = `hasSeenGeneration-${slug}`;
    const seen = localStorage.getItem(storageKey);

    if (!seen) {
      setHasSeenGeneration(false);
      setIsStreaming(true);
      startStreamingEffect(targetContent);
    } else {
      setHasSeenGeneration(true);
      setDisplayedContent(targetContent);
    }
  }, [slug, variants]);

  const startStreamingEffect = (targetContent: string) => {
    let index = 0;
    setDisplayedContent("");

    const streamInterval = setInterval(() => {
      index += Math.floor(Math.random() * 8) + 2; // Random chunk size for typing effect realism
      if (index >= targetContent.length) {
        setDisplayedContent(targetContent);
        setIsStreaming(false);
        localStorage.setItem(`hasSeenGeneration-${slug}`, "true");
        clearInterval(streamInterval);
      } else {
        setDisplayedContent(targetContent.substring(0, index));
      }
    }, 15); // 15ms delay per chunk

    return () => clearInterval(streamInterval);
  };

  const handleSkip = () => {
    setIsStreaming(false);
    const activeContent = variants[persona] || rawPrd;
    setDisplayedContent(activeContent);
    localStorage.setItem(`hasSeenGeneration-${slug}`, "true");
    setHasSeenGeneration(true);
  };

  const handleReplay = () => {
    localStorage.removeItem(`hasSeenGeneration-${slug}`);
    window.location.reload();
  };

  if (!isMounted) {
    return <div className="animate-pulse h-32 bg-muted/20 rounded-lg"></div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* AI Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-primary/20 bg-primary/5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {isStreaming && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            )}
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </div>
          <p className="text-sm font-medium">
            {isStreaming ? (
              <>
                AI is rewriting this PRD for the{" "}
                <span className="text-primary font-bold">{persona}</span> persona...
              </>
            ) : (
              <>
                Personalized for <span className="text-primary font-bold">{persona}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button
              onClick={handleSkip}
              className="text-xs px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-md transition-colors font-medium flex items-center gap-2"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 4h4l9 9-4 4-9-9v-4Z" />
                <path d="m11 11 3 3" />
              </svg>
              Skip Generation
            </button>
          ) : (
            <button
              onClick={handleReplay}
              className="text-xs px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-md transition-colors font-medium flex items-center gap-2"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Replay Effect
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
        {/* Raw PRD Column */}
        <div className="flex flex-col gap-3 relative">
          <div className="sticky top-20">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
              Raw PRD Context
            </h3>
            <div className="p-5 border border-border bg-muted/10 rounded-xl max-h-[70vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap opacity-60">
              {rawPrd}
            </div>
          </div>
        </div>

        {/* Dynamic Output Column */}
        <div className="flex flex-col gap-3 relative">
          <div className="sticky top-20">
            <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              AI Generated Output
            </h3>
            <div
              className={`p-6 border border-primary/20 bg-background rounded-xl min-h-[50vh] prose prose-sm dark:prose-invert max-w-none transition-opacity duration-500 ${isStreaming ? "opacity-100" : "opacity-100"}`}
            >
              <div dangerouslySetInnerHTML={{ __html: displayedContent.replace(/\n/g, "<br/>") }} />
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle"></span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
