"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";

export interface OccupationResult {
  uri: string;
  title: string;
  className: string;
  matchScore?: number;
}

interface OccupationBrowserProps {
  onSearch: (query: string) => Promise<OccupationResult[]>;
  onSelect: (uri: string, title: string) => void;
  selectedUri?: string;
  isLoading?: boolean;
}

const SUGGESTED_SEARCHES = [
  "Software Developer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
  "DevOps Engineer",
  "Machine Learning Engineer",
  "Full Stack Developer",
  "Cloud Architect",
];

function getClassLabel(className: string): string {
  const labels: Record<string, string> = {
    "Occupation": "Occupation",
    "OccupationGroup": "Group",
    "ISCOGroup": "ISCO Group",
  };
  return labels[className] ?? className;
}

export function OccupationBrowser({
  onSearch,
  onSelect,
  selectedUri,
  isLoading = false,
}: OccupationBrowserProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OccupationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setSearching(true);
    setHasSearched(true);
    try {
      const found = await onSearch(searchQuery);
      setResults(found);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleSearch(query);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search occupations (e.g. Software Developer)..."
          className="pl-9 bg-zinc-900/60 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50"
        />
        <Button
          size="sm"
          onClick={() => void handleSearch(query)}
          disabled={!query.trim() || searching}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 bg-amber-600 hover:bg-amber-500 text-white border-0"
        >
          {searching
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : "Search"}
        </Button>
      </div>

      {/* Suggested chips */}
      {!hasSearched && (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium">
            Suggested
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SEARCHES.map(s => (
              <button
                key={s}
                onClick={() => void handleSearch(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900/40 text-zinc-400 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {(searching || isLoading) && (
        <div className="flex items-center justify-center py-10 gap-2 text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Searching ESCO database…</span>
        </div>
      )}

      {/* Results */}
      {!searching && hasSearched && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium">
              {results.length} results for &ldquo;{query}&rdquo;
            </p>
          </div>

          {results.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-600 gap-2">
                <Briefcase className="w-8 h-8 opacity-40" />
                <p className="text-sm">
                  No occupations found. Try a different term.
                </p>
              </div>
            )
            : (
              <ScrollArea className="max-h-[400px]">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 divide-y divide-zinc-800/50">
                  {results.map(occ => {
                    const isSelected = occ.uri === selectedUri;
                    return (
                      <button
                        key={occ.uri}
                        onClick={() => onSelect(occ.uri, occ.title)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors group ${
                          isSelected
                            ? "bg-amber-500/8 border-l-2 border-amber-500"
                            : "hover:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium truncate ${
                                isSelected
                                  ? "text-amber-300"
                                  : "text-zinc-200 group-hover:text-white"
                              }`}
                            >
                              {occ.title}
                            </span>
                            {occ.matchScore !== undefined && (
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 shrink-0 ${
                                  occ.matchScore >= 80
                                    ? "border-green-500/30 text-green-400"
                                    : occ.matchScore >= 60
                                    ? "border-amber-500/30 text-amber-400"
                                    : "border-zinc-600 text-zinc-500"
                                }`}
                              >
                                {occ.matchScore}% match
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-600 mt-0.5 font-mono truncate">
                            {occ.uri}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 border-zinc-700 text-zinc-500"
                          >
                            {getClassLabel(occ.className)}
                          </Badge>
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-colors ${
                              isSelected
                                ? "text-amber-400"
                                : "text-zinc-700 group-hover:text-zinc-400"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
        </div>
      )}

      {/* Empty initial state */}
      {!hasSearched && !searching && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-600">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-amber-500/60" />
          </div>
          <p className="text-sm text-center">
            Search the ESCO database to explore<br />thousands of standardized occupations
          </p>
          <a
            href="https://esco.ec.europa.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-amber-500/60 hover:text-amber-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            ESCO Framework
          </a>
        </div>
      )}
    </div>
  );
}
