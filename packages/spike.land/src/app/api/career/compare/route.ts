import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/rate-limit-presets";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`career:compare:${ip}`, {
    maxRequests: 15,
    windowMs: 60000,
  });

  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 },
    );
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { CompareSkillsSchema } = await import("@/lib/career/schemas");
  const parsed = CompareSkillsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { getOccupation } = await import("@/lib/career/services/esco-client");
  const { compareSkills } = await import(
    "@/lib/career/services/matching-engine"
  );

  const { data: occupation, error: fetchError } = await tryCatch(
    getOccupation(parsed.data.occupationUri),
  );

  if (fetchError || !occupation) {
    return NextResponse.json(
      { error: "Occupation not found" },
      { status: 404 },
    );
  }

  const result = compareSkills(parsed.data.skills, occupation);
  return NextResponse.json({ comparison: result });
}
