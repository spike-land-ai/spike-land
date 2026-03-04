import { Link } from "@tanstack/react-router";
import { useBugbookLeaderboard } from "../../hooks/useBugbook";

const tierColor: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  pro: "bg-blue-100 text-blue-700",
  elite: "bg-amber-100 text-amber-700",
};

export function BugbookLeaderboardPage() {
  const { data, isLoading, isError } = useBugbookLeaderboard();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-cyan-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Link to="/bugbook" className="text-blue-600 hover:underline">&larr; Back to Bugbook</Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          Failed to load leaderboard.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/bugbook" className="text-blue-600 hover:underline">Bugbook</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">Leaderboard</span>
      </div>

      <h1 className="text-2xl font-bold">Leaderboard</h1>

      {/* Top Bugs */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Top Bugs by ELO
        </h2>
        {!data?.topBugs?.length ? (
          <p className="text-sm text-gray-500">No active bugs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Bug</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2 pr-4 text-right">Reports</th>
                  <th className="pb-2 text-right">ELO</th>
                </tr>
              </thead>
              <tbody>
                {data.topBugs.map((bug, i) => (
                  <tr key={bug.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-400">{i + 1}</td>
                    <td className="py-2 pr-4">
                      <Link to="/bugbook/$bugId" params={{ bugId: bug.id }} className="text-blue-600 hover:underline">
                        {bug.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{bug.category}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        bug.severity === "critical" ? "bg-red-100 text-red-700" :
                        bug.severity === "high" ? "bg-orange-100 text-orange-700" :
                        bug.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {bug.severity}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-600">{bug.report_count}</td>
                    <td className="py-2 text-right font-bold text-indigo-600">{bug.elo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Reporters */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Top Bug Reporters
        </h2>
        {!data?.topReporters?.length ? (
          <p className="text-sm text-gray-500">No reporters yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Tier</th>
                  <th className="pb-2 pr-4 text-right">Events</th>
                  <th className="pb-2 text-right">ELO</th>
                </tr>
              </thead>
              <tbody>
                {data.topReporters.map((user, i) => (
                  <tr key={user.user_id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-400">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium text-gray-700">
                      {user.user_id.slice(0, 8)}...
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tierColor[user.tier] ?? ""}`}>
                        {user.tier}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-600">{user.event_count}</td>
                    <td className="py-2 text-right font-bold text-indigo-600">{user.elo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
