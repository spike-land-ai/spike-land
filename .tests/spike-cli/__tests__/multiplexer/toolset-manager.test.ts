import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolsetManager } from "../../../../src/spike-cli/multiplexer/toolset-manager.js";

describe("ToolsetManager", () => {
  let manager: ToolsetManager;
  const mockToolCountFn = vi.fn();

  const toolsets = {
    github: {
      servers: ["github-mcp"],
      description: "GitHub tools",
    },
    testing: {
      servers: ["vitest", "playwright"],
      description: "Testing tools",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockToolCountFn.mockReturnValue(5);
    manager = new ToolsetManager(toolsets, mockToolCountFn);
  });

  describe("isServerVisible", () => {
    it("hides servers in unloaded toolsets", () => {
      expect(manager.isServerVisible("github-mcp")).toBe(false);
      expect(manager.isServerVisible("vitest")).toBe(false);
      expect(manager.isServerVisible("playwright")).toBe(false);
    });

    it("shows servers not in any toolset", () => {
      expect(manager.isServerVisible("standalone-server")).toBe(true);
    });

    it("shows servers after their toolset is loaded", () => {
      manager.loadToolset("github");
      expect(manager.isServerVisible("github-mcp")).toBe(true);
      expect(manager.isServerVisible("vitest")).toBe(false); // still in unloaded toolset
    });
  });

  describe("loadToolset", () => {
    it("loads a valid toolset", () => {
      const result = manager.loadToolset("github");
      expect(result.loaded).toEqual(["github-mcp"]);
      expect(result.toolCount).toBe(5);
    });

    it("throws on unknown toolset", () => {
      expect(() => manager.loadToolset("unknown")).toThrow("Unknown toolset: unknown");
    });

    it("loads multiple toolsets", () => {
      manager.loadToolset("github");
      manager.loadToolset("testing");
      expect(manager.isServerVisible("github-mcp")).toBe(true);
      expect(manager.isServerVisible("vitest")).toBe(true);
      expect(manager.isServerVisible("playwright")).toBe(true);
    });
  });

  describe("unloadToolset", () => {
    it("unloads a loaded toolset", () => {
      manager.loadToolset("github");
      expect(manager.isServerVisible("github-mcp")).toBe(true);
      manager.unloadToolset("github");
      expect(manager.isServerVisible("github-mcp")).toBe(false);
    });

    it("throws on unknown toolset", () => {
      expect(() => manager.unloadToolset("unknown")).toThrow("Unknown toolset: unknown");
    });
  });

  describe("listToolsets", () => {
    it("lists all toolsets with metadata", () => {
      const list = manager.listToolsets();
      expect(list).toHaveLength(2);
      expect(list[0]).toEqual({
        name: "github",
        description: "GitHub tools",
        loaded: false,
        servers: ["github-mcp"],
        toolCount: 5,
      });
    });

    it("shows loaded status after loading", () => {
      manager.loadToolset("github");
      const list = manager.listToolsets();
      const github = list.find((t) => t.name === "github");
      expect(github?.loaded).toBe(true);
    });
  });

  describe("getMetaTools", () => {
    it("returns three meta-tools including spike__unload_toolset", () => {
      const tools = manager.getMetaTools();
      expect(tools).toHaveLength(3);
      expect(tools.map((t) => t.name)).toEqual([
        "spike__list_toolsets",
        "spike__load_toolset",
        "spike__unload_toolset",
      ]);
    });
  });

  describe("isMetaTool", () => {
    it("recognizes meta-tools", () => {
      expect(manager.isMetaTool("spike__list_toolsets")).toBe(true);
      expect(manager.isMetaTool("spike__load_toolset")).toBe(true);
      expect(manager.isMetaTool("spike__unload_toolset")).toBe(true);
      expect(manager.isMetaTool("something_else")).toBe(false);
    });
  });

  describe("handleMetaTool", () => {
    it("handles spike__list_toolsets", () => {
      const result = manager.handleMetaTool("spike__list_toolsets", {});
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe("github");
    });

    it("handles spike__load_toolset", () => {
      const result = manager.handleMetaTool("spike__load_toolset", {
        name: "github",
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Loaded toolset");
      expect(manager.isServerVisible("github-mcp")).toBe(true);
    });

    it("returns error for missing name in spike__load_toolset", () => {
      const result = manager.handleMetaTool("spike__load_toolset", {});
      expect(result.isError).toBe(true);
    });

    it("returns error for unknown toolset in spike__load_toolset", () => {
      const result = manager.handleMetaTool("spike__load_toolset", {
        name: "unknown",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown toolset");
    });

    it("returns error for unknown meta-tool", () => {
      const result = manager.handleMetaTool("spike__unknown", {});
      expect(result.isError).toBe(true);
    });

    it("handles spike__unload_toolset — success", () => {
      manager.loadToolset("github");
      expect(manager.isServerVisible("github-mcp")).toBe(true);
      const result = manager.handleMetaTool("spike__unload_toolset", {
        name: "github",
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Unloaded toolset");
      expect(result.content[0].text).toContain("github-mcp");
      expect(manager.isServerVisible("github-mcp")).toBe(false);
    });

    it("handles spike__unload_toolset — not loaded", () => {
      const result = manager.handleMetaTool("spike__unload_toolset", {
        name: "github",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("not currently loaded");
    });

    it("handles spike__unload_toolset — unknown toolset", () => {
      const result = manager.handleMetaTool("spike__unload_toolset", {
        name: "nonexistent",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown toolset");
    });

    it("handles spike__unload_toolset — missing name", () => {
      const result = manager.handleMetaTool("spike__unload_toolset", {});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("name is required");
    });

    it("unload restores server visibility to hidden", () => {
      // Before loading, servers are hidden
      expect(manager.isServerVisible("vitest")).toBe(false);
      expect(manager.isServerVisible("playwright")).toBe(false);
      // Load the testing toolset
      manager.loadToolset("testing");
      expect(manager.isServerVisible("vitest")).toBe(true);
      expect(manager.isServerVisible("playwright")).toBe(true);
      // Unload via meta-tool
      manager.handleMetaTool("spike__unload_toolset", { name: "testing" });
      // Servers are hidden again
      expect(manager.isServerVisible("vitest")).toBe(false);
      expect(manager.isServerVisible("playwright")).toBe(false);
    });
  });
});

describe("ToolsetManager — default toolCountFn (line 37)", () => {
  it("uses default toolCountFn returning 0 when not provided", () => {
    // Instantiate without toolCountFn to exercise the default parameter branch
    const mgr = new ToolsetManager({
      mytools: { servers: ["srv-a", "srv-b"] },
    });
    const result = mgr.loadToolset("mytools");
    // Default fn returns 0 for each server, so total toolCount = 0
    expect(result.toolCount).toBe(0);
    expect(result.loaded).toEqual(["srv-a", "srv-b"]);
  });
});

describe("ToolsetManager — listToolsets without description (line 72)", () => {
  it("uses empty string when toolset has no description", () => {
    const mgr = new ToolsetManager({
      nodesc: { servers: ["srv"] }, // no description field
    });
    const list = mgr.listToolsets();
    expect(list[0].description).toBe("");
  });
});

describe("ToolsetManager — handleMetaTool non-Error catch (line 151)", () => {
  it("formats non-Error value as String when load fails with non-Error", () => {
    // Create a manager where loadToolset throws a non-Error
    const mgr = new ToolsetManager({
      badtools: { servers: ["srv"] },
    });
    // Patch loadToolset to throw a non-Error
    vi.spyOn(mgr as unknown as { loadToolset: (n: string) => void }, "loadToolset").mockImplementation(() => {
      const nonError: unknown = "string failure";
      throw nonError;
    });

    const result = mgr.handleMetaTool("spike__load_toolset", { name: "badtools" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("string failure");
  });
});
