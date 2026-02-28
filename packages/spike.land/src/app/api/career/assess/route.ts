import type { Occupation } from "@/lib/career/types";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/rate-limit-presets";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`career:assess:${ip}`, {
    maxRequests: 10,
    windowMs: 60000,
  });

  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { AssessSkillsSchema } = await import("@/lib/career/schemas");
  const parsed = AssessSkillsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { searchOccupations, getOccupation } = await import(
    "@/lib/career/services/esco-client"
  );
  const { assessSkills } = await import(
    "@/lib/career/services/matching-engine"
  );

  const { skills, limit = 10 } = parsed.data;

  // Search for occupations using top skill titles
  const queries = skills.slice(0, 5).map(s => s.title);
  const searchResults = await Promise.all(
    queries.map(q => searchOccupations(q, 20)),
  );

  // Deduplicate search results by URI
  const seen = new Set<string>();
  const uniqueUris: string[] = [];
  for (const { results } of searchResults) {
    for (const result of results) {
      if (!seen.has(result.uri)) {
        seen.add(result.uri);
        uniqueUris.push(result.uri);
      }
    }
  }

  // Fetch full occupation details for matching
  const occupationResults = await Promise.all(
    uniqueUris.map(uri => tryCatch(getOccupation(uri))),
  );
  const occupations = occupationResults
    .filter((r): r is { data: Occupation; error: null; } => r.data !== null)
    .map(r => r.data);

  const results = assessSkills(skills, occupations).slice(0, limit);
  return NextResponse.json({ results, total: results.length });
}
