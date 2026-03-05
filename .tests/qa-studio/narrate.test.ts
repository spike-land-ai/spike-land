import { describe, expect, it } from "vitest";

import { narrate, narrateSection, findElementByRef } from "../../src/qa-studio/narrate.js";
import type { AccessibilityNode } from "../../src/qa-studio/types.js";

function makeTree(children: AccessibilityNode[]): AccessibilityNode {
  return { role: "RootWebArea", name: "Test Page", children };
}

describe("narrate", () => {
  it("produces header line with title and URL", () => {
    const tree = makeTree([]);
    const result = narrate(tree, "My Page", "https://example.com");
    expect(result.text).toContain('[Page: "My Page" - https://example.com]');
    expect(result.title).toBe("My Page");
    expect(result.url).toBe("https://example.com");
  });

  it("narrates landmarks without ref numbers", () => {
    const tree = makeTree([
      { role: "banner", children: [] },
      { role: "main", children: [] },
      { role: "contentinfo", children: [] },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).toContain("[banner landmark]");
    expect(result.text).toContain("[main landmark]");
    expect(result.text).toContain("[contentinfo landmark]");
    expect(result.text).not.toContain("ref=");
    expect(result.refCount).toBe(0);
  });

  it("assigns ref numbers to interactive elements", () => {
    const tree = makeTree([
      {
        role: "main",
        children: [
          { role: "link", name: "Home" },
          { role: "button", name: "Submit" },
          { role: "textbox", name: "Email", value: "" },
        ],
      },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).toContain("link ref=1");
    expect(result.text).toContain('"Home"');
    expect(result.text).toContain("button ref=2");
    expect(result.text).toContain('"Submit"');
    expect(result.text).toContain("textbox ref=3");
    expect(result.text).toContain('"Email"');
    expect(result.refCount).toBe(3);
    expect(result.elements).toHaveLength(3);
  });

  it("assigns ref to headings with level", () => {
    const tree = makeTree([
      { role: "heading", name: "Welcome", level: 1 },
      { role: "heading", name: "Section", level: 2 },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).toContain("heading level 1 ref=1");
    expect(result.text).toContain('"Welcome"');
    expect(result.text).toContain("heading level 2 ref=2");
    expect(result.refCount).toBe(2);
  });

  it("shows element states", () => {
    const tree = makeTree([
      { role: "checkbox", name: "Remember me", checked: true },
      { role: "button", name: "Save", disabled: true },
      { role: "tab", name: "Settings", expanded: true },
      { role: "tab", name: "Profile", expanded: false },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).toContain("(checked)");
    expect(result.text).toContain("(disabled)");
    expect(result.text).toContain("(expanded)");
    expect(result.text).toContain("(collapsed)");
  });

  it("shows input values", () => {
    const tree = makeTree([
      { role: "textbox", name: "Username", value: "john" },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).toContain('value: "john"');
  });

  it("does not show empty values", () => {
    const tree = makeTree([
      { role: "textbox", name: "Username", value: "" },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).not.toContain("value:");
  });

  it("skips generic/presentation/none roles but processes children", () => {
    const tree = makeTree([
      {
        role: "generic",
        children: [
          { role: "button", name: "Click me" },
        ],
      },
      {
        role: "presentation",
        children: [
          { role: "link", name: "Link inside" },
        ],
      },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).not.toContain("generic");
    expect(result.text).not.toContain("presentation");
    expect(result.text).toContain("button ref=1");
    expect(result.text).toContain("link ref=2");
  });

  it("narrates static text", () => {
    const tree = makeTree([
      { role: "text", name: "Hello world" },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).toContain('[text] "Hello world"');
  });

  it("indents children under landmarks", () => {
    const tree = makeTree([
      {
        role: "main",
        children: [
          { role: "button", name: "OK" },
        ],
      },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    const lines = result.text.split("\n");
    const mainLine = lines.find((l) => l.includes("main landmark"));
    const buttonLine = lines.find((l) => l.includes("button"));
    expect(mainLine).toBeDefined();
    expect(buttonLine).toBeDefined();
    // Button should be indented relative to landmark
    expect(buttonLine!.startsWith("  ")).toBe(true);
  });

  it("handles named landmarks", () => {
    const tree = makeTree([
      { role: "navigation", name: "Primary", children: [] },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).toContain('[navigation landmark "Primary"]');
  });

  it("narrates named list elements with children", () => {
    const tree = makeTree([
      {
        role: "list",
        name: "Navigation",
        children: [
          { role: "listitem", name: "Item 1" },
        ],
      },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).toContain('[list] "Navigation"');
    expect(result.text).toContain('[listitem] "Item 1"');
  });

  it("narrates unnamed non-interactive role with children but no label line", () => {
    const tree = makeTree([
      {
        role: "group",
        children: [
          { role: "button", name: "Go" },
        ],
      },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.text).not.toContain("[group]");
    expect(result.text).toContain("button ref=1");
  });

  it("populates elements array with correct metadata", () => {
    const tree = makeTree([
      { role: "button", name: "Submit", disabled: true },
      { role: "heading", name: "Title", level: 1 },
    ]);
    const result = narrate(tree, "Test", "https://test.com");
    expect(result.elements[0]).toMatchObject({
      ref: 1,
      role: "button",
      name: "Submit",
      states: ["disabled"],
    });
    expect(result.elements[1]).toMatchObject({
      ref: 2,
      role: "heading",
      name: "Title",
      level: 1,
    });
  });
});

describe("narrateSection", () => {
  it("narrates only the specified landmark", () => {
    const tree = makeTree([
      {
        role: "banner",
        children: [
          { role: "link", name: "Logo" },
        ],
      },
      {
        role: "main",
        children: [
          { role: "button", name: "Submit" },
          { role: "textbox", name: "Email" },
        ],
      },
    ]);
    const result = narrateSection(tree, "main", "Test", "https://test.com");
    expect(result.text).toContain("[main landmark]");
    expect(result.text).toContain("button ref=1");
    expect(result.text).toContain("textbox ref=2");
    expect(result.text).not.toContain("Logo");
    expect(result.refCount).toBe(2);
  });

  it("returns message when landmark not found", () => {
    const tree = makeTree([
      { role: "main", children: [] },
    ]);
    const result = narrateSection(tree, "banner", "Test", "https://test.com");
    expect(result.text).toContain('No "banner" landmark found');
    expect(result.refCount).toBe(0);
  });
});

describe("findElementByRef", () => {
  it("returns the node matching the ref number", () => {
    const tree = makeTree([
      { role: "link", name: "Home" },
      { role: "button", name: "Submit" },
      { role: "textbox", name: "Search" },
    ]);
    const node = findElementByRef(tree, 2);
    expect(node).not.toBeNull();
    expect(node!.role).toBe("button");
    expect(node!.name).toBe("Submit");
  });

  it("returns null for non-existent ref", () => {
    const tree = makeTree([
      { role: "button", name: "OK" },
    ]);
    const node = findElementByRef(tree, 99);
    expect(node).toBeNull();
  });

  it("finds elements inside landmarks", () => {
    const tree = makeTree([
      {
        role: "main",
        children: [
          { role: "link", name: "First" },
          { role: "link", name: "Second" },
        ],
      },
    ]);
    const node = findElementByRef(tree, 2);
    expect(node).not.toBeNull();
    expect(node!.name).toBe("Second");
  });
});
