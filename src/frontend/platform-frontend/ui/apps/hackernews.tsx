import { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, MessageSquare, Clock, TrendingUp, RefreshCw, Loader2 } from "lucide-react";

const HN_API = "https://hacker-news.firebaseio.com/v0";

interface HNStory {
  id: number;
  title: string;
  url?: string;
  by: string;
  score: number;
  descendants: number;
  time: number;
  type: string;
}

type StoryType = "top" | "new" | "best" | "ask" | "show" | "job";

const STORY_TYPES: { value: StoryType; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "new", label: "New" },
  { value: "best", label: "Best" },
  { value: "ask", label: "Ask HN" },
  { value: "show", label: "Show HN" },
  { value: "job", label: "Jobs" },
];

function timeAgo(unixSeconds: number): string {
  const seconds = Math.floor(Date.now() / 1000 - unixSeconds);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getDomain(url?: string): string {
  if (!url) return "self";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

export function HackerNewsApp() {
  const [storyType, setStoryType] = useState<StoryType>("top");
  const [stories, setStories] = useState<HNStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);

  const fetchStories = useCallback(async (type: StoryType) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${HN_API}/${type}stories.json`);
      const ids: number[] = await res.json();
      const top30 = ids.slice(0, 30);

      const items = await Promise.all(
        top30.map(async (id) => {
          const r = await fetch(`${HN_API}/item/${id}.json`);
          return r.json() as Promise<HNStory>;
        }),
      );

      setStories(items.filter(Boolean));
    } catch {
      setStories([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStories(storyType);
  }, [storyType, fetchStories]);

  const filtered = minScore > 0 ? stories.filter((s) => s.score >= minScore) : stories;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30 flex-wrap">
        <div className="flex gap-1">
          {STORY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setStoryType(t.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                storyType === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Min score:
          </label>
          <input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-16 rounded border border-border bg-muted/30 px-2 py-1 text-xs
                       focus:outline-none focus:ring-1 focus:ring-primary"
            min={0}
          />
          <button
            onClick={() => fetchStories(storyType)}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Refresh stories"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Story list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && stories.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">
            No stories match the filter.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((story, idx) => (
              <div
                key={story.id}
                className="flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
              >
                <div className="text-xs text-muted-foreground w-6 pt-0.5 text-right shrink-0 font-mono">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <a
                      href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors
                                 leading-snug flex-1 min-w-0"
                    >
                      {story.title}
                      {story.url && (
                        <ArrowUpRight className="inline w-3 h-3 ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-primary/80">{story.score} pts</span>
                    <span>by {story.by}</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {timeAgo(story.time)}
                    </span>
                    {story.descendants > 0 && (
                      <a
                        href={`https://news.ycombinator.com/item?id=${story.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 hover:text-primary transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {story.descendants}
                      </a>
                    )}
                    {story.url && (
                      <span className="text-muted-foreground/60">
                        ({getDomain(story.url)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
