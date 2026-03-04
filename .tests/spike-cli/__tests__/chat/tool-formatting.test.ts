import { describe, expect, it, vi } from "vitest";
import {
  formatAppGroupedTools,
  formatAppsList,
  formatGroupedTools,
} from "../../../../src/spike-cli/chat/tool-formatting.js";
import type { SessionState } from "../../../../src/spike-cli/chat/session-state.js";
import type { AppRegistry } from "../../../../src/spike-cli/chat/app-registry.js";
import type { NamespacedTool } from "../../../../src/spike-cli/multiplexer/server-manager.js";

function makeSessionState(created: string[] = []): SessionState {
  return {
    hasCreated: vi.fn((prefix: string) => created.includes(prefix)),
    recordCreated: vi.fn(),
    hasId: vi.fn(() => false),
    recordId: vi.fn(),
  } as unknown as SessionState;
}

function makeTool(
  namespacedName: string,
  serverName: string,
  description = "A tool",
  required: string[] = [],
): NamespacedTool {
  return {
    namespacedName,
    originalName: namespacedName.split("__")[1] ?? namespacedName,
    serverName,
    description,
    inputSchema: { type: "object", properties: {}, required },
  };
}

function makeToolWithSchema(
  namespacedName: string,
  serverName: string,
  properties: Record<string, Record<string, unknown>>,
  required: string[] = [],
): NamespacedTool {
  return {
    namespacedName,
    originalName: namespacedName.split("__")[1] ?? namespacedName,
    serverName,
    description: "A tool",
    inputSchema: { type: "object", properties, required },
  };
}

describe("formatGroupedTools", () => {
  it("formats grouped tools", () => {
    const tools = [makeTool("srv__create_item", "srv", "Create item")];
    const sessionState = makeSessionState();
    const result = formatGroupedTools(tools, sessionState);
    expect(result).toContain("create_item");
  });

  it("shows hidden count when dependent tools are hidden", () => {
    const tools = [
      makeTool("srv__create_item", "srv", "Create item", []), // entry point (no required params)
      makeTool("srv__update_item", "srv", "Update item", ["item_id"]), // dependent
      makeTool("srv__delete_item", "srv", "Delete item", ["item_id"]), // dependent
    ];
    // sessionState has NOT created "srv" prefix yet
    const sessionState = makeSessionState([]);
    const result = formatGroupedTools(tools, sessionState);
    // The dependent tools should be hidden
    expect(result).toContain("more");
  });

  it("shows default value hints for tools with defaults", () => {
    const tool = makeToolWithSchema("srv__create_item", "srv", {
      format: { type: "string", default: "json" },
    });
    const sessionState = makeSessionState();
    const result = formatGroupedTools([tool], sessionState);
    expect(result).toContain("format=");
    expect(result).toContain("json");
  });

  it("shows required param hints alongside defaults (both hint branches)", () => {
    // This tool has both a default AND a required param (no default)
    const tool = makeToolWithSchema(
      "srv__create_item",
      "srv",
      {
        format: { type: "string", default: "json" },
        name: { type: "string" },
      },
      ["name"],
    );
    const sessionState = makeSessionState();
    const result = formatGroupedTools([tool], sessionState);
    // Both defaults hint and required hint should appear
    expect(result).toContain("format=");
    expect(result).toContain("name required");
  });

  it("shows required param hints when no defaults exist", () => {
    const tool = makeToolWithSchema(
      "srv__create_item",
      "srv",
      { name: { type: "string" } },
      ["name"],
    );
    const sessionState = makeSessionState();
    const result = formatGroupedTools([tool], sessionState);
    expect(result).toContain("name required");
  });

  it("uses empty string for tool with undefined description", () => {
    const tool: NamespacedTool = {
      namespacedName: "srv__no_desc",
      originalName: "no_desc",
      serverName: "srv",
      description: undefined,
      inputSchema: { type: "object", properties: {}, required: [] },
    };
    const sessionState = makeSessionState();
    const result = formatGroupedTools([tool], sessionState);
    expect(result).toContain("no_desc");
  });

  it("returns no tools message when filter matches nothing", () => {
    const tools = [makeTool("srv__create_item", "srv", "Create item")];
    const sessionState = makeSessionState();
    const result = formatGroupedTools(tools, sessionState, "nonexistent-prefix");
    expect(result).toContain("No tools found");
  });

  it("filters by prefix (extracted from tool name)", () => {
    const tools = [
      makeTool("srv__create_item", "srv"),
      makeTool("srv__list_items", "srv"),
    ];
    const sessionState = makeSessionState();
    // prefix for "create_item" is "create", for "list_items" is "list"
    const result = formatGroupedTools(tools, sessionState, "create");
    expect(result).toContain("create_item");
    expect(result).not.toContain("list_items");
  });
});

describe("formatAppGroupedTools", () => {
  it("uses app-based header when app is registered", () => {
    const tools = [makeTool("myapp__do_thing", "myapp", "Do thing")];
    const sessionState = makeSessionState();
    const mockAppRegistry = {
      getAppForTool: vi.fn().mockReturnValue({
        name: "My App",
        slug: "myapp",
        category: "Productivity",
        tagline: "A great app",
      }),
      getAllApps: vi.fn().mockReturnValue([]),
    } as unknown as AppRegistry;

    const result = formatAppGroupedTools(tools, sessionState, mockAppRegistry);
    expect(result).toContain("My App");
    expect(result).toContain("Productivity");
  });

  it("uses prefix-based fallback header when app is not registered", () => {
    const tools = [makeTool("unregistered__do_thing", "unregistered", "Do thing")];
    const sessionState = makeSessionState();
    const mockAppRegistry = {
      getAppForTool: vi.fn().mockReturnValue(null),
      getAllApps: vi.fn().mockReturnValue([]),
    } as unknown as AppRegistry;

    const result = formatAppGroupedTools(tools, sessionState, mockAppRegistry);
    // Should fall back to prefix-based header (server name)
    expect(result).toContain("unregistered");
  });

  it("shows hidden count when dependent tools are hidden", () => {
    const tools = [
      makeTool("app__create_item", "app", "Create item", []), // entry point
      makeTool("app__update_item", "app", "Update item", ["item_id"]), // dependent
    ];
    const sessionState = makeSessionState([]); // nothing created
    const mockAppRegistry = {
      getAppForTool: vi.fn().mockReturnValue({
        name: "My App",
        slug: "app",
        category: "Tools",
        tagline: "App tools",
      }),
      getAllApps: vi.fn().mockReturnValue([]),
    } as unknown as AppRegistry;

    const result = formatAppGroupedTools(tools, sessionState, mockAppRegistry);
    expect(result).toContain("more");
  });

  it("returns no tools found when filter matches nothing", () => {
    const tools = [makeTool("app__do_thing", "app")];
    const sessionState = makeSessionState();
    const mockAppRegistry = {
      getAppForTool: vi.fn().mockReturnValue(null),
      getAllApps: vi.fn().mockReturnValue([]),
    } as unknown as AppRegistry;

    const result = formatAppGroupedTools(tools, sessionState, mockAppRegistry, "no-match");
    expect(result).toContain('No tools found for "no-match"');
  });

  it("shows no ready badge when tool has required params (hasAllDefaults false branch)", () => {
    const tool = makeToolWithSchema(
      "app__create_item",
      "app",
      { name: { type: "string" } },
      ["name"], // required param without default → hasAllDefaults = false
    );
    const sessionState = makeSessionState();
    const mockAppRegistry = {
      getAppForTool: vi.fn().mockReturnValue({
        name: "My App",
        slug: "app",
        category: "Tools",
        tagline: "App tools",
      }),
      getAllApps: vi.fn().mockReturnValue([]),
    } as unknown as AppRegistry;

    const result = formatAppGroupedTools([tool], sessionState, mockAppRegistry);
    // The "(ready)" badge should NOT appear because there are required params
    expect(result).not.toContain("(ready)");
    expect(result).toContain("create_item");
  });

  it("uses empty string for tool with undefined description in app grouped tools", () => {
    const tool: NamespacedTool = {
      namespacedName: "app__no_desc",
      originalName: "no_desc",
      serverName: "app",
      description: undefined,
      inputSchema: { type: "object", properties: {}, required: [] },
    };
    const sessionState = makeSessionState();
    const mockAppRegistry = {
      getAppForTool: vi.fn().mockReturnValue({
        name: "My App",
        slug: "app",
        category: "Tools",
        tagline: "App tools",
      }),
      getAllApps: vi.fn().mockReturnValue([]),
    } as unknown as AppRegistry;

    const result = formatAppGroupedTools([tool], sessionState, mockAppRegistry);
    expect(result).toContain("no_desc");
  });
});

describe("formatAppsList", () => {
  it("returns 'No apps registered' when empty", () => {
    const mockRegistry = {
      getAllApps: vi.fn().mockReturnValue([]),
    } as unknown as AppRegistry;
    expect(formatAppsList(mockRegistry)).toBe("No apps registered.");
  });

  it("lists apps", () => {
    const mockRegistry = {
      getAllApps: vi.fn().mockReturnValue([
        { name: "My App", slug: "myapp", category: "Productivity", tagline: "A great app" },
      ]),
    } as unknown as AppRegistry;
    const result = formatAppsList(mockRegistry);
    expect(result).toContain("My App");
    expect(result).toContain("Productivity");
  });
});
