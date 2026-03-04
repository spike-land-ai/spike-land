import { useParams, Link } from "@tanstack/react-router";
import { useBugbookDetail, useConfirmBug } from "../../hooks/useBugbook";

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

export function BugbookDetailPage() {
  const { bugId } = useParams({ strict: false });
  const { data, isLoading, isError } = useBugbookDetail(bugId ?? "");
  const confirmBug = useConfirmBug();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-cyan-600" />
      </div>
    );
  }

  if (isError || !data?.bug) {
    return (
      <div className="space-y-4">
        <Link to="/bugbook" className="text-blue-600 hover:underline">&larr; Back to Bugbook</Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          Bug not found.
        </div>
      </div>
    );
  }

  const { bug, reports, eloHistory } = data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/bugbook" className="text-blue-600 hover:underline">Bugbook</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600 truncate max-w-xs">{bug.title}</span>
      </div>

      {/* Header */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{bug.title}</h1>
            {bug.description && (
              <p className="mt-2 text-sm text-gray-600">{bug.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold text-indigo-600">{bug.elo}</div>
            <div className="text-xs text-gray-500">ELO Rating</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[bug.status] ?? ""}`}>
            {bug.status}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${severityColor[bug.severity] ?? ""}`}>
            {bug.severity}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            {bug.category}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            {bug.report_count} report{bug.report_count !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="mt-4 flex gap-6 text-xs text-gray-500">
          <span>First seen: {new Date(bug.first_seen_at).toLocaleDateString()}</span>
          <span>Last seen: {new Date(bug.last_seen_at).toLocaleDateString()}</span>
          {bug.fixed_at && <span>Fixed: {new Date(bug.fixed_at).toLocaleDateString()}</span>}
        </div>

        {bug.status !== "FIXED" && bug.status !== "DEPRECATED" && (
          <button
            onClick={() => confirmBug.mutate(bugId ?? "")}
            disabled={confirmBug.isPending}
            className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {confirmBug.isPending ? "Confirming..." : "I have this bug too"}
          </button>
        )}

        {confirmBug.isError && (
          <p className="mt-2 text-sm text-red-600">{confirmBug.error.message}</p>
        )}
      </div>

      {/* ELO History */}
      {eloHistory.length > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            ELO History
          </h2>
          <div className="space-y-2">
            {eloHistory.map((entry, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-600">{entry.reason.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{entry.old_elo} &rarr; {entry.new_elo}</span>
                  <span className={`font-medium ${entry.change_amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {entry.change_amount >= 0 ? "+" : ""}{entry.change_amount}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Reports ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">No reports yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700">{report.description}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${severityColor[report.severity] ?? ""}`}>
                    {report.severity}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-gray-400">
                  <span>Service: {report.service_name}</span>
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
