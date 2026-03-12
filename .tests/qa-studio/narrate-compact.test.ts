import { describe, expect, it } from "vitest";

import {
  narrateCompact,
  narrateCompactSection,
} from "../../src/core/browser-automation/core-logic/narrate.js";
import type { AccessibilityNode } from "../../src/core/browser-automation/core-logic/types.js";

function makeTree(children: AccessibilityNode[]): AccessibilityNode {
  return { role: "RootWebArea", name: "Test Page", children };
}

describe("narrateCompact", () => {
  it("produces compact header without protocol", () => {
    const tree = makeTree([]);
    const result = narrateCompact(tree, "My Page", "https://example.com");
    expect(result.text).toContain('[Page "My Page" example.com]');
    expect(result.text).not.toContain("https://");
  });

  it("uses short landmark names", () => {
    const tree = makeTree([
      { role: "banner", children: [] },
      { role: "navigation", children: [] },
      { role: "main", children: [] },
      { role: "contentinfo", children: [] },
    ]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    expect(result.text).toContain("[banner]");
    expect(result.text).toContain("[nav]");
    expect(result.text).toContain("[main]");
    expect(result.text).toContain("[footer]");
  });

  it("uses h1-h6 for headings", () => {
    const tree = makeTree([
      { role: "heading", name: "Title", level: 1 },
      { role: "heading", name: "Sub", level: 2 },
    ]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    expect(result.text).toContain("[h1]");
    expect(result.text).toContain("[h2]");
    expect(result.text).not.toContain("heading level");
  });

  it("assigns ref numbers to interactive elements", () => {
    const tree = makeTree([
      { role: "link", name: "Home" },
      { role: "button", name: "Submit" },
    ]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    expect(result.text).toContain("ref=1");
    expect(result.text).toContain("ref=2");
    expect(result.refCount).toBe(2);
  });

  it("truncates long text to 80 chars", () => {
    const longText = "A".repeat(120);
    const tree = makeTree([{ role: "text", name: longText }]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    const textLine = result.text.split("\n").find((l) => l.includes("[text]"));
    expect(textLine).toBeDefined();
    expect(textLine?.length).toBeLessThan(100);
    expect(textLine).toContain("\u2026");
  });

  it("skips generic/presentation roles", () => {
    const tree = makeTree([
      {
        role: "generic",
        children: [{ role: "button", name: "Click" }],
      },
    ]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    expect(result.text).not.toContain("generic");
    expect(result.text).toContain("button");
  });

  it("shows non-default states", () => {
    const tree = makeTree([
      { role: "checkbox", name: "Remember", checked: true },
      { role: "button", name: "Save", disabled: true },
    ]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    expect(result.text).toContain("(checked)");
    expect(result.text).toContain("(disabled)");
  });

  it("collapses consecutive interactive siblings", () => {
    const tree = makeTree([
      {
        role: "main",
        children: [
          { role: "link", name: "Home" },
          { role: "link", name: "About" },
          { role: "link", name: "Contact" },
        ],
      },
    ]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    // Should have pipes between collapsed items
    expect(result.text).toContain("|");
    // All 3 refs should exist
    expect(result.refCount).toBe(3);
  });

  it("does not collapse headings with siblings", () => {
    const tree = makeTree([
      { role: "heading", name: "Title", level: 1 },
      { role: "button", name: "Action" },
    ]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    const lines = result.text.split("\n").filter((l) => l.includes("ref="));
    // Heading and button should be on separate lines
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it("populates elements array correctly", () => {
    const tree = makeTree([
      { role: "button", name: "OK" },
      { role: "textbox", name: "Name", value: "John" },
    ]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    expect(result.elements).toHaveLength(2);
    expect(result.elements[0]).toMatchObject({ ref: 1, role: "button", name: "OK" });
    expect(result.elements[1]).toMatchObject({
      ref: 2,
      role: "textbox",
      name: "Name",
      value: "John",
    });
  });

  it("shows values for inputs", () => {
    const tree = makeTree([{ role: "textbox", name: "Email", value: "test@example.com" }]);
    const result = narrateCompact(tree, "Test", "https://test.com");
    expect(result.text).toContain('="test@example.com"');
  });
});

describe("narrateCompactSection", () => {
  it("narrates only the specified landmark", () => {
    const tree = makeTree([
      { role: "banner", children: [{ role: "link", name: "Logo" }] },
      { role: "main", children: [{ role: "button", name: "Go" }] },
    ]);
    const result = narrateCompactSection(tree, "main", "Test", "https://test.com");
    expect(result.text).toContain("[main]");
    expect(result.text).toContain("ref=1");
    expect(result.text).not.toContain("Logo");
  });

  it("returns message when landmark not found", () => {
    const tree = makeTree([{ role: "main", children: [] }]);
    const result = narrateCompactSection(tree, "banner", "Test", "https://test.com");
    expect(result.text).toContain('No "banner" found');
    expect(result.refCount).toBe(0);
  });

  it("uses short URL in header", () => {
    const tree = makeTree([{ role: "main", children: [] }]);
    const result = narrateCompactSection(tree, "main", "Test", "https://example.com/page");
    expect(result.text).toContain("example.com/page");
    expect(result.text).not.toContain("https://");
  });
});
