/** Maximum concurrent HEAD requests when checking broken links. */
const CONCURRENCY_LIMIT = 10;

/** Timeout in milliseconds for each outbound fetch. */
const FETCH_TIMEOUT_MS = 10_000;

export interface LinkCheckResult {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
}

export interface HeadingNode {
  level: number;
  text: string;
}

export interface HealthReport {
  url: string;
  fetchedAt: string;
  responseTimeMs: number;
  httpStatus: number;
  render: {
    hasTitle: boolean;
    title: string | null;
    hasBody: boolean;
    hasViewportMeta: boolean;
  };
  accessibility: {
    imagesTotal: number;
    imagesWithAlt: number;
    altCoverage: number;
    headings: HeadingNode[];
    headingHierarchyValid: boolean;
  };
  links: {
    total: number;
    broken: LinkCheckResult[];
    unchecked: number;
  };
}

function extractMeta(html: string, name: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const altPattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*name=["']${name}["'][^>]*>`,
    "i",
  );
  const m = pattern.exec(html) ?? altPattern.exec(html);
  return m?.[1] ?? null;
}

function extractTitle(html: string): string | null {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return m?.[1]?.trim() ?? null;
}

function hasBody(html: string): boolean {
  return /<body[\s>]/i.test(html);
}

function extractLinks(html: string, baseUrl: string): string[] {
  const hrefs: string[] = [];
  const pattern = /<a[^>]+href=["']([^"'#][^"']*?)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(html)) !== null) {
    const raw = m[1];
    if (!raw) continue;
    try {
      const resolved = new URL(raw, baseUrl).toString();
      if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
        hrefs.push(resolved);
      }
    } catch {
      // skip malformed URLs
    }
  }
  return [...new Set(hrefs)];
}

function extractImageSrcs(html: string, baseUrl: string): Array<{ src: string; hasAlt: boolean }> {
  const images: Array<{ src: string; hasAlt: boolean }> = [];
  const pattern = /<img([^>]*?)>/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(html)) !== null) {
    const attrs = m[1] ?? "";
    const srcMatch = /src=["']([^"']+)["']/i.exec(attrs);
    if (!srcMatch?.[1]) continue;
    const hasAlt = /alt=["'][^"']*["']/i.test(attrs);
    try {
      const resolved = new URL(srcMatch[1], baseUrl).toString();
      if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
        images.push({ src: resolved, hasAlt });
      }
    } catch {
      // skip malformed URLs
    }
  }
  return images;
}

function extractHeadings(html: string): HeadingNode[] {
  const headings: HeadingNode[] = [];
  const pattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(html)) !== null) {
    const level = parseInt(m[1] ?? "1", 10);
    // Strip inner tags to get text content
    const text = (m[2] ?? "").replace(/<[^>]+>/g, "").trim();
    headings.push({ level, text });
  }
  return headings;
}

function checkHeadingHierarchy(headings: HeadingNode[]): boolean {
  if (headings.length === 0) return true;
  let prevLevel = 0;
  for (const h of headings) {
    if (prevLevel === 0) {
      prevLevel = h.level;
      continue;
    }
    // Allow same level, going up, or going down by at most 1
    if (h.level > prevLevel + 1) return false;
    prevLevel = h.level;
  }
  return true;
}

async function headCheck(url: string): Promise<LinkCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "spike-land-qa-health-check/1.0" },
    });
    return { url, status: response.status, ok: response.ok };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { url, status: null, ok: false, error };
  } finally {
    clearTimeout(timer);
  }
}

async function checkLinksWithConcurrency(
  urls: string[],
  concurrency: number,
): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(headCheck));
    results.push(...batchResults);
  }
  return results;
}

export async function qaHealthCheck(url: string): Promise<HealthReport> {
  const fetchedAt = new Date().toISOString();
  const start = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let httpStatus = 0;
  let html = "";

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "spike-land-qa-health-check/1.0" },
    });
    httpStatus = response.status;
    html = await response.text();
  } finally {
    clearTimeout(timer);
  }

  const responseTimeMs = Date.now() - start;

  // --- Render checks ---
  const title = extractTitle(html);
  const viewportContent = extractMeta(html, "viewport");
  const hasViewportMeta = viewportContent !== null;

  // --- Accessibility checks ---
  const images = extractImageSrcs(html, url);
  const imagesWithAlt = images.filter((img) => img.hasAlt).length;
  const altCoverage =
    images.length > 0 ? Math.round((imagesWithAlt / images.length) * 100) / 100 : 1;

  const headings = extractHeadings(html);
  const headingHierarchyValid = checkHeadingHierarchy(headings);

  // --- Broken link checks ---
  const allLinks = extractLinks(html, url);
  const imageSrcs = [...new Set(images.map((img) => img.src))];
  const allUrlsToCheck = [...new Set([...allLinks, ...imageSrcs])];

  // Cap at 50 URLs to avoid Worker CPU/time limits
  const MAX_CHECK = 50;
  const urlsToCheck = allUrlsToCheck.slice(0, MAX_CHECK);
  const unchecked = allUrlsToCheck.length - urlsToCheck.length;

  const linkResults = await checkLinksWithConcurrency(urlsToCheck, CONCURRENCY_LIMIT);
  const broken = linkResults.filter((r) => !r.ok);

  return {
    url,
    fetchedAt,
    responseTimeMs,
    httpStatus,
    render: {
      hasTitle: title !== null,
      title,
      hasBody: hasBody(html),
      hasViewportMeta,
    },
    accessibility: {
      imagesTotal: images.length,
      imagesWithAlt,
      altCoverage,
      headings,
      headingHierarchyValid,
    },
    links: {
      total: allUrlsToCheck.length,
      broken,
      unchecked,
    },
  };
}
