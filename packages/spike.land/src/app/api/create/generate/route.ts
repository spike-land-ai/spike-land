import {
  buildSystemPrompt,
  buildUserPrompt,
  getMatchedSkills,
} from "@/lib/create/content-generator";
import { extractKeywords } from "@/lib/create/keyword-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");

  if (!topic || topic.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing 'topic' query parameter" },
      { status: 400 },
    );
  }

  const keywords = extractKeywords(topic);
  const matchedSkills = getMatchedSkills(topic);
  const systemPrompt = buildSystemPrompt(topic);
  const userPrompt = buildUserPrompt(topic);

  return NextResponse.json({
    topic,
    keywords,
    matchedSkills,
    systemPrompt,
    userPrompt,
  });
}
