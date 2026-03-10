import { describe, expect, it } from "vitest";
import { groupToolExecutionBatches } from "../routes/chat-tool-batching.js";

describe("groupToolExecutionBatches", () => {
  it("groups adjacent MCP-style calls into parallel batches", () => {
    const batches = groupToolExecutionBatches([
      { toolCallId: "1", name: "mcp_tool_search" },
      { toolCallId: "2", name: "mcp_tool_call" },
      { toolCallId: "3", name: "mcp_tool_call" },
    ]);

    expect(batches).toHaveLength(1);
    expect(batches[0]?.map((entry) => entry.toolCallId)).toEqual(["1", "2", "3"]);
  });

  it("keeps browser tools as serialized barriers between parallel batches", () => {
    const batches = groupToolExecutionBatches([
      { toolCallId: "1", name: "mcp_tool_search" },
      { toolCallId: "2", name: "mcp_tool_call" },
      { toolCallId: "3", name: "browser_navigate" },
      { toolCallId: "4", name: "mcp_tool_call" },
      { toolCallId: "5", name: "browser_click" },
    ]);

    expect(batches.map((batch) => batch.map((entry) => entry.toolCallId))).toEqual([
      ["1", "2"],
      ["3"],
      ["4"],
      ["5"],
    ]);
  });
});
