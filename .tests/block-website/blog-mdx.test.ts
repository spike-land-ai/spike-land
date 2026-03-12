import { describe, expect, it } from "vitest";
import {
  coerceBooleanProp,
  coerceNumberProp,
  parseStoryMappings,
  preprocessBlogMdx,
} from "../../src/core/block-website/core-logic/blog-mdx";

describe("blog MDX preprocessing", () => {
  it("normalizes literal props without touching fenced code blocks", () => {
    const source = [
      "<SpikeChatEmbed guestAccess={true} height={500} />",
      "",
      "```tsx",
      "<SpikeChatEmbed guestAccess={true} />",
      "```",
    ].join("\n");

    const result = preprocessBlogMdx(source);

    expect(result).toContain('<SpikeChatEmbed guestAccess="true" height="500"></SpikeChatEmbed>');
    expect(result).toContain("```tsx\n<SpikeChatEmbed guestAccess={true} />\n```");
  });

  it("serializes ScrollStoryCard mappings into a parsable JSON attribute", () => {
    const source = [
      "<ScrollStoryCard",
      '  title="The Restaurant"',
      '  illustration="restaurant"',
      "  mappings={[",
      '    { left: "Customer", right: "MCP Client" },',
      '    { left: "Menu", right: "Resource" }',
      "  ]}",
      "/>",
    ].join("\n");

    const result = preprocessBlogMdx(source);
    const match = result.match(/mappings='([^']+)'/);

    expect(match?.[1]).toBeTruthy();
    expect(parseStoryMappings(match?.[1])).toEqual([
      { left: "Customer", right: "MCP Client" },
      { left: "Menu", right: "Resource" },
    ]);
  });

  it("coerces primitive custom component props", () => {
    expect(coerceBooleanProp("true")).toBe(true);
    expect(coerceBooleanProp("false", true)).toBe(false);
    expect(coerceNumberProp("500", 0)).toBe(500);
    expect(coerceNumberProp(undefined, 42)).toBe(42);
  });
});
