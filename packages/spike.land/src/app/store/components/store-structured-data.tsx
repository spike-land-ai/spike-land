import { STORE_APPS } from "@/app/store/data/store-apps";

export function StoreStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Spike Land App Store",
    "description":
      "Free AI-generated React apps powered by MCP tools. Regenerated daily by AI agents using the latest models.",
    "url": "https://spike.land/store",
    "provider": {
      "@type": "Organization",
      "name": "Spike Land",
      "url": "https://spike.land",
    },
    "hasPart": STORE_APPS.map(app => ({
      "@type": "SoftwareApplication",
      "name": app.name,
      "description": app.description,
      "applicationCategory": "WebApplication",
      "url": `https://spike.land/store/${app.slug}`,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "GBP",
      },
    })),
  };

  // Safe: JSON.stringify of controlled data (no user input), same pattern as
  // src/components/seo/LandingPageStructuredData.tsx
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
