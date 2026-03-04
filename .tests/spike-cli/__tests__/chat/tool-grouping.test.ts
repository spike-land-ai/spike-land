/**
 * Tests for chat/tool-grouping.ts covering uncovered branches:
 * Line 33: stripNamespace returns namespacedName unchanged when prefix doesn't match
 * Line 183: getVisibleTools — isDependentTool false → else → visible.push
 * Line 221: getVisibleToolsEnhanced — hasCreated prefix fallback (visible path)
 */
import { describe, expect, it } from "vitest";
import {
  getVisibleTools,
  getVisibleToolsEnhanced,
  stripNamespace,
} from "../../../../src/spike-cli/chat/slash-commands.js";
import { SessionState } from "../../../../src/spike-cli/chat/session-state.js";
import type { NamespacedTool } from "../../../../src/spike-cli/multiplexer/server-manager.js";

function makeTool(overrides: Partial<NamespacedTool> & { namespacedName: string }): NamespacedTool {
  return {
    originalName: overrides.namespacedName.replace(/^[^_]+__/, ""),
    serverName: "srv",
    description: "A tool",
    inputSchema: { type: "object", properties: {} },
    ...overrides,
  } as NamespacedTool;
}

describe("stripNamespace", () => {
  it("returns namespacedName unchanged when prefix does not match (line 33)", () => {
    // "other__tool" does not start with "srv__", so returns the full name
    const result = stripNamespace("other__tool", "srv");
    expect(result).toBe("other__tool");
  });

  it("strips prefix when it matches", () => {
    const result = stripNamespace("srv__my_tool", "srv");
    expect(result).toBe("my_tool");
  });
});

describe("getVisibleTools — non-entry non-dependent tool (line 183 else branch)", () => {
  it("shows tools that are neither entry-point nor dependent", () => {
    const state = new SessionState();

    // A tool with a non-id required param and no create/list/search keyword in name
    // → isEntryPointTool: required.length > 0, name has no entry keywords → false
    // → isDependentTool: required param "target" doesn't match /_id$|^id$/i → false
    // → falls to else: visible.push (line 183)
    const tools = [
      makeTool({
        namespacedName: "srv__run_tests",
        serverName: "srv",
        inputSchema: {
          type: "object",
          properties: { target: { type: "string" } },
          required: ["target"],
        },
      }),
    ];

    const { visible, hidden } = getVisibleTools(tools, state);
    expect(visible).toHaveLength(1);
    expect(hidden).toBe(0);
  });
});

describe("getVisibleTools — tool with no required field (lines 130-138 ?? [] branch)", () => {
  it("treats tool with no required field as non-dependent (isDependentTool false)", () => {
    const state = new SessionState();

    // Tool with no 'required' field in schema → (inputSchema.required ?? []) = []
    // isDependentTool: false, isEntryPointTool: true (no required params) → visible
    const tools = [
      makeTool({
        namespacedName: "srv__chess_create_game",
        serverName: "srv",
        inputSchema: {
          type: "object",
          properties: { time_control: { type: "string" } },
          // no 'required' field
        },
      }),
    ];

    const { visible, hidden } = getVisibleTools(tools, state);
    expect(visible).toHaveLength(1);
    expect(hidden).toBe(0);
  });

  it("getVisibleToolsEnhanced with no required field treats as non-dependent (lines 138 ?? [])", () => {
    const state = new SessionState();

    // Tool without 'required' — getRequiredIdParams returns []
    // isDependentTool: false → visible.push (line 227)
    const tools = [
      makeTool({
        namespacedName: "srv__chess_list_games",
        serverName: "srv",
        inputSchema: {
          type: "object",
          properties: {},
          // no 'required' field at all
        },
      }),
    ];

    const { visible, hidden } = getVisibleToolsEnhanced(tools, state);
    expect(visible).toHaveLength(1);
    expect(hidden).toBe(0);
  });
});

describe("getVisibleToolsEnhanced — prefix-based hasCreated fallback (line 221)", () => {
  it("shows dependent tool via prefix fallback when hasCreated is true but specific IDs not recorded", () => {
    const state = new SessionState();
    // Record via recordCreate directly (not via recordIds), so hasId("game_id") is false
    // but hasCreated("chess") is true
    state.recordCreate("chess", ["_created"]);

    // Tool requires game_id — isDependentTool: true (game_id ends in _id)
    // allIdsSatisfied: false (game_id not in IDs)
    // prefix-based fallback: hasCreated("chess") = true → visible (line 221)
    const tools = [
      makeTool({
        namespacedName: "srv__chess_make_move",
        serverName: "srv",
        inputSchema: {
          type: "object",
          properties: { game_id: { type: "string" } },
          required: ["game_id"],
        },
      }),
    ];

    const { visible, hidden } = getVisibleToolsEnhanced(tools, state);
    expect(visible).toHaveLength(1);
    expect(hidden).toBe(0);
  });
});

// ---------- SessionState.recordIds — non-object JSON (line 39) ----------

describe("SessionState.recordIds — non-object parsed values (line 39)", () => {
  it("returns early when parsed JSON is a string (line 39 true branch)", () => {
    const state = new SessionState();
    // JSON.parse('"hello"') is a string — typeof "string" !== "object" → early return
    state.recordIds('"hello"');
    // Nothing should be recorded
    expect(state.hasId("id")).toBe(false);
  });

  it("returns early when parsed JSON is null (line 39 true branch)", () => {
    const state = new SessionState();
    // JSON.parse("null") is null → parsed === null → early return
    state.recordIds("null");
    expect(state.hasId("id")).toBe(false);
  });

  it("returns early when parsed JSON is a number (line 39 true branch)", () => {
    const state = new SessionState();
    state.recordIds("42");
    expect(state.hasId("id")).toBe(false);
  });
});
