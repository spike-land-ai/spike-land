import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useBugbookList } from "../../hooks/useBugbook";
import type { Bug } from "../../hooks/useBugbook";

const STATUSES = ["All", "CANDIDATE", "ACTIVE", "FIXED", "DEPRECATED"] as const;
const SORTS = [
  { value: "elo" as const, label: "ELO Rating" },
  { value: "recent" as const, label: "Most Recent" },
];

const severityColor: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const statusColor: Record<string, string> = {
  CANDIDATE: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-red-100 text-red-700",
  FIXED: "bg-green-100 text-green-700",
  DEPRECATED: "bg-gray-100 text-gray-500",
};

function BugCard({ bug }: { bug: Bug }) {
  return (
    <Link
      to="/bugbook/$bugId"
      params={{ bugId: bug.id }}
      className="group block rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight group-hover:text-blue-600">{bug.title}</h3>
        <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
          {bug.elo}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[bug.status] ?? ""}`}>
          {bug.status}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColor[bug.severity] ?? ""}`}>
          {bug.severity}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {bug.category}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        <span>{bug.report_count} report{bug.report_count !== 1 ? "s" : ""}</span>
        <span>Last seen {new Date(bug.last_seen_at).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}

export function BugbookIndexPage() {
  const [status, setStatus] = useState<string>("All");
  const [sort, setSort] = useState<"elo" | "recent">("elo");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useBugbookList({
    status: status === "All" ? undefined : status,
    sort,
    limit: 100,
  });

  const filtered = data?.bugs?.filter((bug) =>
    bug.title.toLowerCase().includes(search.toLowerCase()) ||
    bug.category.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bugbook</h1>
          <p className="text-sm text-gray-500">Public bug tracker with ELO ranking</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/bugbook/leaderboard"
            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            Leaderboard
          </Link>
          <span className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
            {data?.total ?? 0} bugs
          </span>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search bugs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                status === s
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                sort === s.value
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-cyan-600" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          Failed to load bugs. Try refreshing.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center text-gray-500">
          No bugs found matching your filters.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((bug) => (
          <BugCard key={bug.id} bug={bug} />
        ))}
      </div>
    </div>
  );
}
