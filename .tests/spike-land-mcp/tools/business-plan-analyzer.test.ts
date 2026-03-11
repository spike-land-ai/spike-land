import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchWebsiteContent,
  buildAnalysisPrompt,
  type ExtractedContent,
} from "../../../src/edge-api/spike-land/core-logic/tools/business-plan-analyzer";

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>AcmeTech - AI-Powered Analytics</title>
  <meta name="description" content="AcmeTech helps SaaS companies grow with AI analytics.">
  <meta property="og:title" content="AcmeTech Platform">
  <meta property="og:description" content="AI analytics for SaaS growth">
  <meta property="og:type" content="website">
</head>
<body>
  <nav><a href="/about">About</a><a href="/pricing">Pricing</a></nav>
  <main>
    <h1>Grow Your SaaS 10x Faster</h1>
    <p>AcmeTech serves 5,000+ customers across 40 countries.</p>
    <p>We raised $12M in our Series A led by Sequoia Capital.</p>
    <p>Our team of 45 engineers builds cutting-edge AI models.</p>
    <p>150% year-over-year revenue growth since 2023.</p>
    <p>Founded in 2021 by Jane Smith (ex-Google) and John Doe (ex-Stripe).</p>
    <a href="https://sequoia.com">Sequoia Capital</a>
    <a href="https://techcrunch.com/acmetech">Press Coverage</a>
    <a href="/demo">Request Demo</a>
  </main>
  <footer><p>&copy; 2024 AcmeTech Inc.</p></footer>
  <script>console.log("tracking");</script>
  <style>.hidden { display: none; }</style>
</body>
</html>`;

function createMockFetch(html: string, status = 200): typeof globalThis.fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 400,
    status,
    text: vi.fn().mockResolvedValue(html),
    json: vi.fn().mockResolvedValue({}),
  }) as unknown as typeof globalThis.fetch;
}

describe("fetchWebsiteContent", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("extracts title, description, bodyText, metaTags, and links from HTML", async () => {
    globalThis.fetch = createMockFetch(SAMPLE_HTML);

    const result = await fetchWebsiteContent("https://acmetech.com");

    expect(result.title).toBe("AcmeTech - AI-Powered Analytics");
    expect(result.description).toBe("AcmeTech helps SaaS companies grow with AI analytics.");
    expect(result.metaTags["og:title"]).toBe("AcmeTech Platform");
    expect(result.metaTags["og:type"]).toBe("website");
    expect(result.bodyText).toContain("5,000+ customers");
    expect(result.bodyText).toContain("$12M");
    expect(result.bodyText).toContain("Series A");
    // Script and style content should be stripped
    expect(result.bodyText).not.toContain("tracking");
    expect(result.bodyText).not.toContain("display: none");
    // Links
    expect(result.links).toContain("https://sequoia.com");
    expect(result.links).toContain("https://techcrunch.com/acmetech");
    expect(result.links).toContain("/demo");
    expect(result.fetchedAt).toBeTruthy();
  });

  it("throws McpError on HTTP error", async () => {
    globalThis.fetch = createMockFetch("Forbidden", 403);

    await expect(fetchWebsiteContent("https://private.com")).rejects.toThrow("HTTP 403");
  });

  it("throws McpError on timeout (abort)", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        }, 10);
      });
    }) as unknown as typeof globalThis.fetch;

    await expect(fetchWebsiteContent("https://slow.com")).rejects.toThrow("timed out");
  });

  it("handles HTML entities in title and content", async () => {
    const html = `<html><head><title>Foo &amp; Bar&#39;s &quot;Best&quot;</title></head><body><p>Price: &lt;$10&gt;</p></body></html>`;
    globalThis.fetch = createMockFetch(html);

    const result = await fetchWebsiteContent("https://example.com");
    expect(result.title).toBe('Foo & Bar\'s "Best"');
    expect(result.bodyText).toContain("Price: <$10>");
  });

  it("deduplicates links", async () => {
    const html = `<html><head><title>Test</title></head><body><a href="https://a.com">A</a><a href="https://a.com">A again</a><a href="https://b.com">B</a></body></html>`;
    globalThis.fetch = createMockFetch(html);

    const result = await fetchWebsiteContent("https://example.com");
    expect(result.links.filter((l) => l === "https://a.com").length).toBe(1);
  });
});

describe("buildAnalysisPrompt", () => {
  const mockContent: ExtractedContent = {
    title: "TestCo",
    description: "A test company",
    bodyText: "We are TestCo. We help businesses.",
    links: ["https://testco.com/about"],
    metaTags: { description: "A test company", "og:title": "TestCo" },
    fetchedAt: "2026-03-11T12:00:00.000Z",
  };

  it("contains all 12 PRO_V1 section headers", () => {
    const { system } = buildAnalysisPrompt(mockContent, "general");

    const requiredSections = [
      "COMPANY",
      "CLASSIFICATION",
      "EXECUTIVE VIEW",
      "CLAIM REGISTER",
      "TRACTION ANALYSIS",
      "FINANCIAL ANALYSIS",
      "TEAM ANALYSIS",
      "RISK ENGINE",
      "DILIGENCE ASSISTANT",
      "EVIDENCE LIBRARY",
      "REFERENCE LIBRARY",
      "META",
    ];

    for (const section of requiredSections) {
      expect(system).toContain(section);
    }
  });

  it("includes the GOLDEN RULE", () => {
    const { system } = buildAnalysisPrompt(mockContent, "general");
    expect(system).toContain("GOLDEN RULE");
    expect(system).toContain("evidence_ids");
  });

  it("includes focus-specific instructions", () => {
    const { system: saasSystem } = buildAnalysisPrompt(mockContent, "saas");
    expect(saasSystem).toContain("ARR");
    expect(saasSystem).toContain("churn");

    const { system: fintechSystem } = buildAnalysisPrompt(mockContent, "fintech");
    expect(fintechSystem).toContain("regulatory compliance");
  });

  it("includes content in user message", () => {
    const { user } = buildAnalysisPrompt(mockContent, "general");
    expect(user).toContain("TestCo");
    expect(user).toContain("A test company");
    expect(user).toContain("We are TestCo");
    expect(user).toContain("https://testco.com/about");
  });

  it("includes schema_version PRO_V1 in system prompt", () => {
    const { system } = buildAnalysisPrompt(mockContent, "general");
    expect(system).toContain("schema_version: PRO_V1");
  });
});
