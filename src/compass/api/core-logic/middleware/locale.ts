import type { Context, Next } from "hono";
import type { ContextVariables } from "../../types.js";

const DEFAULT_LOCALE = "en";

/**
 * Parses the Accept-Language header and returns the highest-priority language
 * tag (e.g. "fr-CA" from "fr-CA,fr;q=0.9,en;q=0.8").
 *
 * Returns DEFAULT_LOCALE when the header is absent or unparseable.
 */
function parseAcceptLanguage(header: string | undefined): string {
  if (!header) return DEFAULT_LOCALE;

  // Accept-Language = *( language-range [ ";" "q" "=" qvalue ] )
  const best = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";") as [string, string | undefined];
      const q = qPart ? parseFloat(qPart.replace(/^\s*q\s*=\s*/i, "")) : 1.0;
      return { tag: tag?.trim() ?? "", q: isNaN(q) ? 1.0 : q };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q)[0];

  return best?.tag ?? DEFAULT_LOCALE;
}

/**
 * Reads the Accept-Language request header, resolves the preferred locale, and
 * attaches it to the Hono context as `locale`.
 *
 * Downstream handlers can access it via `c.get("locale")`.
 */
export async function localeMiddleware(
  c: Context<{ Variables: ContextVariables }>,
  next: Next,
): Promise<void> {
  const header = c.req.header("accept-language");
  const locale = parseAcceptLanguage(header);
  c.set("locale", locale);
  await next();
}

/** Exported for unit testing. */
export { parseAcceptLanguage };
