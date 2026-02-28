import { LearnItSearch } from "@/components/learnit/search";
import { TopicCard } from "@/components/learnit/topic-card";
import type { LearnItContent as LearnItContentType } from "@/generated/prisma";
import {
  getContentByTopicSlugs,
  getPopularContent,
  getRecentContent,
} from "@/lib/learnit/content-service";
import { getPersonaTopics } from "@/lib/onboarding/persona-topics";
import { getPersonaBySlug } from "@/lib/onboarding/personas";
import { logger } from "@/lib/logger";
import { BookOpen, Sparkles } from "lucide-react";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function LearnItLanding() {
  const cookieStore = await cookies();
  const personaSlug = cookieStore.get("spike-persona")?.value ?? null;
  const persona = personaSlug ? getPersonaBySlug(personaSlug) : null;
  const personaTopics = personaSlug ? getPersonaTopics(personaSlug) : [];

  let popular: LearnItContentType[] = [];
  let recent: LearnItContentType[] = [];
  let recommended: LearnItContentType[] = [];

  try {
    const fetches: [
      Promise<LearnItContentType[]>,
      Promise<LearnItContentType[]>,
      Promise<LearnItContentType[]>,
    ] = [
      getPopularContent(6),
      getRecentContent(6),
      personaTopics.length > 0
        ? getContentByTopicSlugs(personaTopics, 6)
        : Promise.resolve([]),
    ];

    [popular, recent, recommended] = await Promise.all(fetches);
  } catch (error) {
    logger.error("Failed to load LearnIt content", error);
  }

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          <BookOpen className="w-4 h-4" />
          <span className="font-semibold tracking-widest uppercase text-[10px]">
            AI-Powered Wiki
          </span>
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-white tracking-tighter">
          Learn anything.{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Instantly.
          </span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light">
          An interactive, AI-powered learning wiki that grows with you. Search for any topic to
          generate a comprehensive tutorial.
        </p>
        <div className="pt-4">
          <LearnItSearch />
        </div>
      </section>

      {/* Recommended for You (persona-based) */}
      {persona && recommended.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">
              Recommended for You
            </h2>
            <span className="text-sm text-zinc-500 ml-2">
              Based on your {persona.name} profile
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.map(topic => (
              <TopicCard
                key={topic.id}
                title={topic.title}
                description={topic.description}
                slug={topic.slug}
                viewCount={topic.viewCount}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Starter Topics (persona-based, shown when no DB content matches) */}
      {persona && recommended.length === 0 && personaTopics.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">
              Recommended for You
            </h2>
            <span className="text-sm text-zinc-500 ml-2">
              Based on your {persona.name} profile
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {personaTopics.map(topicSlug => (
              <TopicCard
                key={topicSlug}
                title={topicSlug.replace(/-/g, " ").replace(
                  /\b\w/g,
                  c => c.toUpperCase(),
                )}
                description={`Explore ${topicSlug.replace(/-/g, " ")}`}
                slug={topicSlug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular Topics */}
      {popular.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-white">Popular Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popular.map(topic => (
              <TopicCard
                key={topic.id}
                title={topic.title}
                description={topic.description}
                slug={topic.slug}
                viewCount={topic.viewCount}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured Starter Topics (Hardcoded for bootstrapping) */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-white">Start Learning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {["Programming", "Machine Learning", "History", "Design"].map(
            tag => (
              <TopicCard
                key={tag}
                title={tag}
                description={`Start your journey into ${tag}`}
                slug={tag.toLowerCase().replace(/\s+/g, "-")}
              />
            ),
          )}
        </div>
      </section>

      {/* Recent Topics */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-white">Recently Added</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map(topic => (
              <TopicCard
                key={topic.id}
                title={topic.title}
                description={topic.description}
                slug={topic.slug}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
