const ALLOWED_IMAGE_HOSTS = new Set([
  "avatars.githubusercontent.com",
  "image-studio-mcp.spike.land",
  "spike.land",
  "www.spike.land",
  "local.spike.land",
  "dev.spike.land",
  "localhost",
  "127.0.0.1",
]);

const ALLOWED_IMAGE_HOST_SUFFIXES = [
  ".r2.dev",
  ".r2.cloudflarestorage.com",
  ".googleusercontent.com",
  ".basemaps.cartocdn.com",
];

export function isAllowedBlogImageSrc(src?: string | null): boolean {
  if (!src) return false;

  const trimmed = src.trim();
  if (!trimmed) return false;

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;

    return (
      ALLOWED_IMAGE_HOSTS.has(url.hostname) ||
      ALLOWED_IMAGE_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))
    );
  } catch {
    return false;
  }
}

export function sanitizeBlogImageSrc(src?: string | null): string | null {
  return isAllowedBlogImageSrc(src) ? src!.trim() : null;
}

export function hashImagePrompt(prompt: string): string {
  let hash = 2166136261;

  for (let i = 0; i < prompt.length; i++) {
    hash ^= prompt.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function buildPromptDrivenBlogImageSrc(
  src?: string | null,
  prompt?: string | null,
): string | null {
  const safeSrc = sanitizeBlogImageSrc(src);
  if (!safeSrc) return null;

  const normalizedPrompt = prompt?.trim();
  if (!normalizedPrompt) return safeSrc;

  const version = hashImagePrompt(normalizedPrompt);

  try {
    const base =
      safeSrc.startsWith("http://") || safeSrc.startsWith("https://")
        ? new URL(safeSrc)
        : new URL(safeSrc, "https://spike.land");

    base.searchParams.set("prompt", normalizedPrompt);
    base.searchParams.set("v", version);

    if (safeSrc.startsWith("http://") || safeSrc.startsWith("https://")) {
      return base.toString();
    }

    return `${base.pathname}${base.search}${base.hash}`;
  } catch {
    return safeSrc;
  }
}
