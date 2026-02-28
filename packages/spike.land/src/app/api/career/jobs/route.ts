import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/rate-limit-presets";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`career:jobs:${ip}`, {
    maxRequests: 20,
    windowMs: 60000,
  });

  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const location = url.searchParams.get("location") ?? undefined;
  const countryCode = url.searchParams.get("country") ?? "gb";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const { searchJobs } = await import(
    "@/lib/career/services/job-search-client"
  );
  const { tryCatch } = await import("@/lib/try-catch");

  const { data, error } = await tryCatch(
    searchJobs(query, location, countryCode, page, limit),
  );

  if (error) {
    return NextResponse.json(
      { error: "Job search failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ jobs: data.jobs, total: data.total, page });
}
