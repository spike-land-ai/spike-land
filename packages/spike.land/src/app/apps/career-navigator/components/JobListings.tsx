"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  description: string;
  url: string;
  created: string;
  category: string;
}

interface JobListingsProps {
  onSearch: (
    query: string,
    location: string,
    countryCode: string,
    page: number,
  ) => Promise<{
    jobs: JobListing[];
    total?: number;
  }>;
  isLoading?: boolean;
}

const COUNTRY_OPTIONS = [
  { code: "gb", label: "UK", flag: "🇬🇧" },
  { code: "us", label: "US", flag: "🇺🇸" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "au", label: "AU", flag: "🇦🇺" },
];

const QUICK_SEARCHES = [
  "React Developer",
  "TypeScript Engineer",
  "Full Stack",
  "AI Engineer",
  "Cloud Engineer",
];

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string,
): string {
  if (!min && !max) return "";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function JobCard({ job }: { job: JobListing; }) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
  const dateLabel = formatDate(job.created);
  const shortDesc = job.description.length > 180
    ? job.description.slice(0, 180).trimEnd() + "…"
    : job.description;

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:border-amber-500/25 hover:bg-zinc-900/60 transition-all p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-100 group-hover:text-white text-sm leading-snug">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Building2 className="w-3 h-3 text-zinc-600" />
              {job.company}
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="w-3 h-3 text-zinc-600" />
              {job.location}
            </span>
          </div>
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-600/15 border border-amber-600/25 text-amber-400 hover:bg-amber-600/25 transition-colors"
          aria-label={`Apply for ${job.title} at ${job.company}`}
        >
          Apply
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap">
        {salary && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
            <DollarSign className="w-3 h-3" />
            {salary}
          </span>
        )}
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 border-zinc-700 text-zinc-500"
        >
          {job.category}
        </Badge>
        {dateLabel && (
          <span className="flex items-center gap-1 text-[10px] text-zinc-600 ml-auto">
            <Calendar className="w-3 h-3" />
            {dateLabel}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
        {shortDesc}
      </p>
    </div>
  );
}

export function JobListings({ onSearch, isLoading = false }: JobListingsProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [countryCode, setCountryCode] = useState("gb");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery?: string, nextPage = 1) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;
    if (searchQuery) setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setPage(nextPage);
    try {
      const result = await onSearch(q, location, countryCode, nextPage);
      setJobs(result.jobs);
      setTotal(result.total ?? result.jobs.length);
    } catch {
      setError("Failed to fetch jobs. Please try again.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-4">
      {/* Search controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") void handleSearch();
              }}
              placeholder="Job title or skills…"
              className="pl-9 bg-zinc-900/60 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50"
            />
          </div>
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            className="h-10 appearance-none rounded-md border border-zinc-700 bg-zinc-900/60 px-3 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50"
            aria-label="Country"
          >
            {COUNTRY_OPTIONS.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") void handleSearch();
              }}
              placeholder="Location (optional)"
              className="pl-9 bg-zinc-900/60 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50"
            />
          </div>
          <Button
            onClick={() => void handleSearch()}
            disabled={!query.trim() || loading || isLoading}
            className="bg-amber-600 hover:bg-amber-500 text-white border-0 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      {/* Quick searches */}
      {!hasSearched && (
        <div className="flex flex-wrap gap-2">
          {QUICK_SEARCHES.map(s => (
            <button
              key={s}
              onClick={() => void handleSearch(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900/40 text-zinc-500 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/5 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Searching Adzuna…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && jobs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-600">
          <Briefcase className="w-8 h-8 opacity-40" />
          <p className="text-sm">No jobs found. Try a different search.</p>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium">
              {total.toLocaleString()} jobs found
            </p>
            <p className="text-[11px] text-zinc-600">
              Page {page} of {totalPages}
            </p>
          </div>

          <ScrollArea className="max-h-[520px]">
            <div className="space-y-3">
              {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSearch(query, page - 1)}
                disabled={page <= 1 || loading}
                className="border-zinc-700 bg-transparent hover:bg-zinc-800 gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </Button>
              <span className="text-xs text-zinc-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSearch(query, page + 1)}
                disabled={page >= totalPages || loading}
                className="border-zinc-700 bg-transparent hover:bg-zinc-800 gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-600">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-blue-500/60" />
          </div>
          <p className="text-sm text-center">
            Search live job listings<br />powered by Adzuna
          </p>
        </div>
      )}
    </div>
  );
}
