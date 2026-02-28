import { NextResponse } from "next/server";
import { STORE_APPS } from "@/app/store/data/store-apps";
import type { StoreApp } from "@/app/store/data/types";

function scoreApp(target: StoreApp, candidate: StoreApp): number {
  if (target.id === candidate.id) return -1;
  let score = 0;
  // Same category: 3 points
  if (target.category === candidate.category) score += 3;
  // Tag overlap: 2 points per shared tag
  const targetTags = new Set(target.tags);
  for (const tag of candidate.tags) {
    if (targetTags.has(tag)) score += 2;
  }
  // Both featured: 1 point
  if (target.isFeatured && candidate.isFeatured) score += 1;
  return score;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const appSlug = searchParams.get("appSlug");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "4", 10), 8);

  if (!appSlug) {
    return NextResponse.json({ error: "appSlug required" }, { status: 400 });
  }

  const target = STORE_APPS.find(a => a.slug === appSlug);
  if (!target) {
    return NextResponse.json({ recommendations: [] });
  }

  const scored = STORE_APPS
    .map(app => ({ app, score: scoreApp(target, app) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ app }) => app);

  return NextResponse.json({ recommendations: scored });
}
