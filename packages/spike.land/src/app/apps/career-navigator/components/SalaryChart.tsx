"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  DollarSign,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";

export interface SalaryDataPoint {
  occupationTitle: string;
  median: number;
  p25: number;
  p75: number;
  currency: string;
  location: string;
  source: string;
}

interface SalaryChartProps {
  onFetchSalary: (
    title: string,
    countryCode: string,
  ) => Promise<SalaryDataPoint | null>;
  isLoading?: boolean;
}

const COUNTRY_OPTIONS: { code: string; label: string; flag: string; }[] = [
  { code: "gb", label: "United Kingdom", flag: "🇬🇧" },
  { code: "us", label: "United States", flag: "🇺🇸" },
  { code: "de", label: "Germany", flag: "🇩🇪" },
  { code: "fr", label: "France", flag: "🇫🇷" },
  { code: "nl", label: "Netherlands", flag: "🇳🇱" },
  { code: "au", label: "Australia", flag: "🇦🇺" },
];

const QUICK_ROLES = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "DevOps Engineer",
  "UX Designer",
];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);
}

function SalaryBar(
  { value, max, color }: { value: number; max: number; color: string; },
) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SalaryCard({ data }: { data: SalaryDataPoint; }) {
  const max = data.p75 * 1.1;
  const spread = data.p75 - data.p25;
  const spreadPct = data.median > 0
    ? Math.round((spread / data.median) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-zinc-100">
            {data.occupationTitle}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {data.location} &middot; {data.source}
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-amber-500/30 text-amber-400 shrink-0"
        >
          {formatCurrency(data.median, data.currency)} median
        </Badge>
      </div>

      {/* Percentile bars */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">25th Percentile</span>
            <span className="text-sm font-semibold text-zinc-300">
              {formatCurrency(data.p25, data.currency)}
            </span>
          </div>
          <SalaryBar value={data.p25} max={max} color="bg-blue-500/70" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Median</span>
            <span className="text-sm font-semibold text-amber-400">
              {formatCurrency(data.median, data.currency)}
            </span>
          </div>
          <SalaryBar value={data.median} max={max} color="bg-amber-500" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">75th Percentile</span>
            <span className="text-sm font-semibold text-green-400">
              {formatCurrency(data.p75, data.currency)}
            </span>
          </div>
          <SalaryBar value={data.p75} max={max} color="bg-green-500/70" />
        </div>
      </div>

      {/* Range visualization */}
      <div className="rounded-xl bg-zinc-800/50 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{formatCurrency(data.p25, data.currency)}</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            {spreadPct}% spread
          </span>
          <span>{formatCurrency(data.p75, data.currency)}</span>
        </div>
        {/* Horizontal range bar */}
        <div className="relative h-6 rounded-lg bg-zinc-800 overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500/40 via-amber-500/60 to-green-500/40 rounded-lg"
            style={{
              left: `${Math.round((data.p25 / max) * 100)}%`,
              width: `${Math.round(((data.p75 - data.p25) / max) * 100)}%`,
            }}
          />
          {/* Median marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-amber-400"
            style={{ left: `${Math.round((data.median / max) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function SalaryChart(
  { onFetchSalary, isLoading = false }: SalaryChartProps,
) {
  const [query, setQuery] = useState("");
  const [countryCode, setCountryCode] = useState("gb");
  const [salaryData, setSalaryData] = useState<SalaryDataPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const handleFetch = async (title?: string) => {
    const searchTitle = title ?? query;
    if (!searchTitle.trim()) return;
    if (title) setQuery(title);
    setLoading(true);
    setError(null);
    setHasFetched(true);
    try {
      const data = await onFetchSalary(searchTitle, countryCode);
      setSalaryData(data);
      if (!data) {
        setError("No salary data available for this role and location.");
      }
    } catch {
      setError("Failed to fetch salary data. Please try again.");
      setSalaryData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") void handleFetch();
            }}
            placeholder="Role title (e.g. Software Engineer)"
            className="pl-9 bg-zinc-900/60 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50"
          />
        </div>

        {/* Country selector */}
        <div className="relative">
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            className="h-10 appearance-none rounded-md border border-zinc-700 bg-zinc-900/60 px-3 pr-7 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50"
            aria-label="Country"
          >
            {COUNTRY_OPTIONS.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code.toUpperCase()}
              </option>
            ))}
          </select>
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
        </div>

        <Button
          onClick={() => void handleFetch()}
          disabled={!query.trim() || loading || isLoading}
          className="bg-amber-600 hover:bg-amber-500 text-white border-0 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
        </Button>
      </div>

      {/* Quick role chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ROLES.map(role => (
          <button
            key={role}
            onClick={() => void handleFetch(role)}
            className="text-xs px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900/40 text-zinc-500 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/5 transition-colors"
          >
            {role}
          </button>
        ))}
      </div>

      {/* Loading */}
      {(loading || isLoading) && (
        <div className="flex items-center justify-center py-12 gap-2 text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Fetching salary data…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && salaryData && <SalaryCard data={salaryData} />}

      {/* Empty state */}
      {!hasFetched && !loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-600">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-green-500/60" />
          </div>
          <p className="text-sm text-center">
            Enter a job title to see salary ranges<br />for your country
          </p>
        </div>
      )}
    </div>
  );
}
