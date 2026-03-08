let cachedVersion: string | null = null;
let expiresAt = 0;
const TTL_MS = 60 * 1000; // 1 minute

export function resetCacheVersionForTesting() {
  cachedVersion = null;
  expiresAt = 0;
}

export async function getCacheVersion(spaAssets: R2Bucket): Promise<string> {
  const now = Date.now();
  if (cachedVersion && now < expiresAt) return cachedVersion;

  const obj = await spaAssets.get("index.html");
  if (obj) {
    const html = await obj.text();
    const match = html.match(/<meta\s+name="build-sha"\s+content="([^"]+)"/);
    if (match?.[1]) {
      cachedVersion = match[1].slice(0, 12);
      expiresAt = now + TTL_MS;
      return cachedVersion;
    }
  }

  // Fallback: timestamp-based (changes every minute at worst)
  const bucket = Math.floor(now / TTL_MS);
  cachedVersion = bucket.toString(36);
  expiresAt = (bucket + 1) * TTL_MS;
  return cachedVersion;
}
