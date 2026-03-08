import { useMyBugReports } from "../../hooks/useBugbook";
import { Badge } from "../../../core-logic/badge";
import { Skeleton } from "../../../core-logic/skeleton";
import { Link } from "@tanstack/react-router";
import { AuthGuard } from "../../components/AuthGuard";

export function MyReportsPage() {
  return (
    <AuthGuard>
      <MyReportsContent />
    </AuthGuard>
  );
}

function MyReportsContent() {
  const { data, isLoading, error } = useMyBugReports();

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-8 max-w-4xl text-red-500">
        Error loading your reports. Make sure you are logged in.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FIXED":
        return "bg-green-500/10 text-green-500";
      case "ACTIVE":
        return "bg-blue-500/10 text-blue-500";
      case "DEPRECATED":
        return "bg-neutral-500/10 text-neutral-500";
      default:
        return "bg-yellow-500/10 text-yellow-500";
    }
  };

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">My Bug Reports</h1>
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">My ELO:</span>
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/20">
            {data.userElo.elo} ({data.userElo.tier})
          </Badge>
        </div>
      </div>

      {data.reports.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/50 rounded-lg border border-neutral-800">
          <p className="text-neutral-400">You haven't reported any bugs yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.reports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800 flex flex-col sm:flex-row justify-between gap-4"
            >
              <div>
                <Link
                  to="/bugbook/$bugId"
                  params={{ bugId: report.bug_id }}
                  className="text-lg font-medium text-white hover:underline"
                >
                  {report.bug_title}
                </Link>
                <p className="text-neutral-400 mt-1 line-clamp-2">{report.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Bug ELO: {report.bug_elo}</span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2">
                <Badge variant="outline" className={getStatusColor(report.bug_status)}>
                  {report.bug_status}
                </Badge>
                <Badge variant="outline" className="border-neutral-800">
                  {report.severity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
