import { BlogPreviewSection } from "@/components/landing/BlogPreviewSection";
import { AppShowcaseSection } from "@/components/landing/AppShowcaseSection";
import { CreateCTASection } from "@/components/landing/CreateCTASection";
import { LandingHero } from "@/components/landing/LandingHero";
import { McpShowcaseSection } from "@/components/landing/McpShowcaseSection";
import { ThreePillarsSection } from "@/components/landing/ThreePillarsSection";
import { PersonalizedWelcome } from "@/components/client-only-providers";
import { LandingPageStructuredData } from "@/components/seo/LandingPageStructuredData";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top";
import { getLatestShowcaseApps } from "@/lib/landing/showcase-feed";
import { logger } from "@/lib/logger";

// Revalidate every 5 minutes so stats stay fresh
export const revalidate = 300;

export default async function Home() {
  let showcaseApps: Awaited<ReturnType<typeof getLatestShowcaseApps>> = [];
  try {
    showcaseApps = await Promise.race([
      getLatestShowcaseApps(10),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Showcase apps fetch timed out")), 5000)
      ),
    ]);
  } catch (e) {
    logger.error("Failed to load landing page data:", e);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingPageStructuredData />

      <section aria-label="Hero">
        <LandingHero />
      </section>

      <section aria-label="Personalized welcome">
        <PersonalizedWelcome />
      </section>

      <section aria-label="Platform pillars">
        <ThreePillarsSection />
      </section>

      <section aria-label="App showcase">
        <AppShowcaseSection apps={showcaseApps} />
      </section>

      <section aria-label="MCP tools">
        <McpShowcaseSection />
      </section>

      <section aria-label="Blog">
        <BlogPreviewSection />
      </section>

      <section aria-label="Get started">
        <CreateCTASection />
      </section>

      <ScrollToTopButton />
    </div>
  );
}
