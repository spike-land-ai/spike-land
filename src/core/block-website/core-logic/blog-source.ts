export interface ExtractedHeroMedia {
  heroImage: string | null;
  heroPrompt: string | null;
  body: string;
}

interface ImageReference {
  line: string;
  src: string;
  prompt: string | null;
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function extractMarkdownImage(line: string): ImageReference | null {
  const match = line.match(/^!\[(.*?)\]\((\/blog\/[^)\s]+)(?:\s+["'][^"']*["'])?\)\s*$/);
  if (!match?.[2]) return null;

  return {
    line,
    src: match[2],
    prompt: normalizeText(match[1]),
  };
}

function extractHtmlImage(line: string): ImageReference | null {
  if (!line.includes("<img")) return null;

  const srcMatch = line.match(/\bsrc=["'](\/blog\/[^"']+)["']/i);
  if (!srcMatch?.[1]) return null;

  const altMatch = line.match(/\balt=["']([^"']*)["']/i);
  return {
    line,
    src: srcMatch[1],
    prompt: normalizeText(altMatch?.[1] ?? null),
  };
}

function extractImageReference(line: string): ImageReference | null {
  return extractMarkdownImage(line) ?? extractHtmlImage(line);
}

function stripLine(body: string, line: string): string {
  return body.replace(`${line}\n`, "").replace(line, "").trim();
}

export function findImagePrompt(content: string, imagePath: string): string | null {
  for (const line of content.split("\n")) {
    const image = extractImageReference(line);
    if (image?.src === imagePath) {
      return image.prompt;
    }
  }

  return null;
}

export function extractHeroMedia(
  content: string,
  frontmatterHeroImage: string | null,
  frontmatterHeroPrompt: string | null,
): ExtractedHeroMedia {
  let heroImage = normalizeText(frontmatterHeroImage);
  let heroPrompt = normalizeText(frontmatterHeroPrompt);
  let body = content.trim();

  const candidateLines = body.split("\n").slice(0, 8);

  if (!heroImage) {
    for (const line of candidateLines) {
      const image = extractImageReference(line);
      if (!image?.src || image.src.includes("placehold.co")) continue;

      heroImage = image.src;
      heroPrompt = heroPrompt ?? image.prompt;
      body = stripLine(body, line);
      break;
    }

    return { heroImage, heroPrompt, body };
  }

  for (const line of candidateLines) {
    const image = extractImageReference(line);
    if (image?.src !== heroImage) continue;

    heroPrompt = heroPrompt ?? image.prompt;
    body = stripLine(body, line);
    return { heroImage, heroPrompt, body };
  }

  heroPrompt = heroPrompt ?? findImagePrompt(body, heroImage);
  return { heroImage, heroPrompt, body };
}
