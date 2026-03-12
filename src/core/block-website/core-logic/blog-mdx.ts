export interface StoryMapping {
  left: string;
  right: string;
}

const CODE_FENCE_PATTERN = /(```[\s\S]*?```)/g;
const LITERAL_PROP_PATTERN = /\s+([A-Za-z_:][\w:.-]*)=\{(true|false|-?\d+(?:\.\d+)?)\}/g;

/**
 * Convert self-closing JSX/HTML tags for custom components to explicit
 * open/close pairs so react-markdown keeps them intact.
 */
export function fixSelfClosingTags(markdown: string): string {
  return markdown.replace(
    /<([A-Z][a-zA-Z]*)((?:\s+[a-zA-Z-]+=(?:"[^"]*"|'[^']*'|{[^}]*}))*)\s*\/>/g,
    (_, tag, attrs) => `<${tag}${attrs}></${tag}>`,
  );
}

function normalizeObjectLiteralKeys(input: string): string {
  return input.replace(/([{,]\s*)([A-Za-z_][\w-]*)\s*:/g, '$1"$2":');
}

function normalizeMdxComponentProps(segment: string): string {
  return segment.replace(
    /<([A-Z][A-Za-z0-9]*)([\s\S]*?)(\/>|>[\s\S]*?<\/\1>)/g,
    (_match: string, tag: string, attrs: string, closing: string) => {
      let normalizedAttrs = attrs.replace(
        LITERAL_PROP_PATTERN,
        (_: string, name: string, value: string) => ` ${name}="${value}"`,
      );

      normalizedAttrs = normalizedAttrs.replace(
        /\s+mappings=\{(\[[\s\S]*?\])\}/g,
        (_: string, literal: string) => {
          try {
            const normalizedJson = normalizeObjectLiteralKeys(literal);
            const encoded = JSON.stringify(JSON.parse(normalizedJson)).replace(/'/g, "&apos;");
            return ` mappings='${encoded}'`;
          } catch {
            return ` mappings='[]'`;
          }
        },
      );

      return `<${tag}${normalizedAttrs}${closing}`;
    },
  );
}

export function preprocessBlogMdx(markdown: string): string {
  const parts = markdown.split(CODE_FENCE_PATTERN);
  return parts
    .map((part, index) =>
      index % 2 === 1 ? part : fixSelfClosingTags(normalizeMdxComponentProps(part)),
    )
    .join("");
}

export function coerceBooleanProp(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

export function coerceNumberProp(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function isStoryMapping(value: unknown): value is StoryMapping {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate["left"] === "string" && typeof candidate["right"] === "string";
}

export function parseStoryMappings(value: unknown): StoryMapping[] | undefined {
  if (Array.isArray(value)) {
    return value.filter(isStoryMapping);
  }

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isStoryMapping) : undefined;
  } catch {
    return undefined;
  }
}
