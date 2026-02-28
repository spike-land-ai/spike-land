import { describe, expect, it } from "vitest";
import { createMockRegistry } from "../shared/test-utils";
import { pageBuilderTools } from "./tools";

describe("page-builder standalone tools", () => {
  const registry = createMockRegistry(pageBuilderTools);

  it("exports exactly 23 tools", () => {
    expect(registry.getToolNames()).toHaveLength(23);
  });

  it("has all pages tools", () => {
    const names = registry.getToolNames();
    expect(names).toContain("pages_create");
    expect(names).toContain("pages_get");
    expect(names).toContain("pages_list");
    expect(names).toContain("pages_update");
    expect(names).toContain("pages_delete");
    expect(names).toContain("pages_publish");
    expect(names).toContain("pages_clone");
  });

  it("has all blocks tools", () => {
    const names = registry.getToolNames();
    expect(names).toContain("blocks_add");
    expect(names).toContain("blocks_update");
    expect(names).toContain("blocks_delete");
    expect(names).toContain("blocks_reorder");
    expect(names).toContain("blocks_list_types");
    expect(names).toContain("blocks_get");
  });

  it("has all page-ai tools", () => {
    const names = registry.getToolNames();
    expect(names).toContain("page_ai_generate");
    expect(names).toContain("page_ai_enhance_block");
    expect(names).toContain("page_ai_suggest_layout");
    expect(names).toContain("page_ai_generate_theme");
    expect(names).toContain("page_ai_populate_store");
  });

  it("has page_review tool", () => {
    expect(registry.getToolNames()).toContain("page_review");
  });

  it("has all template/SEO tools", () => {
    const names = registry.getToolNames();
    expect(names).toContain("pages_list_templates");
    expect(names).toContain("pages_apply_template");
    expect(names).toContain("pages_get_seo");
    expect(names).toContain("pages_set_seo");
  });

  it("categorises tools correctly", () => {
    const pagesTools = registry.getToolsByCategory("pages");
    const blocksTools = registry.getToolsByCategory("blocks");
    const aiTools = registry.getToolsByCategory("page-ai");
    const reviewTools = registry.getToolsByCategory("page-review");
    const templateTools = registry.getToolsByCategory("page-templates");
    expect(pagesTools.length).toBe(7);
    expect(blocksTools.length).toBe(6);
    expect(aiTools.length).toBe(5);
    expect(reviewTools.length).toBe(1);
    expect(templateTools.length).toBe(4);
    expect(7 + 6 + 5 + 1 + 4).toBe(23); // templates tools (4) separate from main page count
  });

  it("each tool has a description", () => {
    for (const tool of pageBuilderTools) {
      expect(tool.description).toBeTruthy();
      expect(typeof tool.description).toBe("string");
    }
  });
});
