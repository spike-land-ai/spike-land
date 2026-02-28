import { ApiEndpointCard } from "@/components/docs/ApiEndpointCard";
import type { DocsApiEndpoint } from "@/lib/docs/types";
import { Code2, Lock } from "lucide-react";

import apiManifest from "@/lib/docs/generated/api-manifest.json";

export const metadata = {
  title: "API Reference - spike.land",
  description:
    "Complete API reference for the spike.land platform. Browse all endpoints grouped by domain.",
};

function groupByDomain(
  endpoints: DocsApiEndpoint[],
): Record<string, DocsApiEndpoint[]> {
  const groups: Record<string, DocsApiEndpoint[]> = {};
  for (const endpoint of endpoints) {
    const domain = endpoint.domain;
    if (!groups[domain]) {
      groups[domain] = [];
    }
    groups[domain].push(endpoint);
  }
  return groups;
}

export default function ApiReferencePage() {
  const endpoints = apiManifest as DocsApiEndpoint[];
  const grouped = groupByDomain(endpoints);
  const domainNames = Object.keys(grouped).sort();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="relative py-8 px-6 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Code2 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-foreground">
                API Reference
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {endpoints.length} endpoints across {domainNames.length} domains
              </p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Complete REST API reference for the spike.land platform. All endpoints are grouped by
            domain. Endpoints marked with{" "}
            <Lock className="inline h-3.5 w-3.5 text-amber-400 mx-0.5" /> require authentication.
          </p>
        </div>
      </div>

      {/* Domain Sections */}
      {domainNames.map(domain => {
        const domainEndpoints = grouped[domain];
        if (!domainEndpoints) return null;

        return (
          <section key={domain} className="space-y-4">
            <details className="group" open>
              <summary className="flex items-center gap-3 cursor-pointer list-none select-none py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                <svg
                  className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200 group-open:rotate-90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <h2 className="text-xl font-bold font-heading capitalize tracking-tight text-foreground">
                  {domain.replace(/-/g, " ")}
                </h2>
                <span className="text-[10px] font-semibold bg-white/10 text-muted-foreground px-2 py-0.5 rounded-md tabular-nums">
                  {domainEndpoints.length}
                </span>
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pl-7">
                {domainEndpoints.map(endpoint => (
                  <ApiEndpointCard key={endpoint.path} endpoint={endpoint} />
                ))}
              </div>
            </details>
          </section>
        );
      })}
    </div>
  );
}
