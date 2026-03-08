import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PixelTerminal } from "../PixelTerminal";
import * as useToolsHook from "@/hooks/useTools";
import * as apiClient from "@/api/client";

vi.mock("@/hooks/useTools");
vi.mock("@/api/client");
vi.mock("@/components/ui/DynamicToolForm", () => ({
  DynamicToolForm: ({ toolName, onSubmit }: any) => (
    <div data-testid={`tool-form-${toolName}`}>
      <button onClick={() => onSubmit({ arg: "value" })}>Submit {toolName}</button>
    </div>
  ),
}));

describe("PixelTerminal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders welcome message initially", () => {
    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [],
      byName: new Map(),
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    expect(screen.getByRole("application", { name: /Pixel Studio terminal/i })).toBeInTheDocument();
    expect(screen.getByText(/for commands, or enter a tool name to get/i)).toBeInTheDocument();
  });

  it("handles 'help' command", async () => {
    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [],
      byName: new Map(),
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");
    fireEvent.change(input, { target: { value: "help" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText(/Available commands:/i)).toBeInTheDocument();
    expect(screen.getByText("tools <category>")).toBeInTheDocument();
  });

  it("handles 'clear' command", async () => {
    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [],
      byName: new Map(),
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");

    // Type help first to add content
    fireEvent.change(input, { target: { value: "help" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText(/Available commands:/i)).toBeInTheDocument();

    // Type clear to remove content
    fireEvent.change(input, { target: { value: "clear" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.queryByText(/Available commands:/i)).not.toBeInTheDocument();
    });
    // Welcome message should be back
    expect(screen.getByText(/for commands, or enter a tool name to get/i)).toBeInTheDocument();
  });

  it("handles 'history' command", async () => {
    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [],
      byName: new Map(),
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");
    fireEvent.change(input, { target: { value: "help" } });
    fireEvent.keyDown(input, { key: "Enter" });

    fireEvent.change(input, { target: { value: "history" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText(/1 help/)).toBeInTheDocument();
  });

  it("handles 'tools' command", async () => {
    const mockTool = { name: "test_tool", description: "A test tool", category: "Test", tier: "free" };
    const byName = new Map([["test_tool", mockTool]]);
    const grouped = new Map([["Test", [mockTool]]]);

    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [mockTool],
      byName,
      grouped,
      categories: ["Test"],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");
    fireEvent.change(input, { target: { value: "tools" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText(/\[Test\]/)).toBeInTheDocument();
      expect(screen.getByText(/test_tool/)).toBeInTheDocument();
      expect(screen.getByText(/A test tool/)).toBeInTheDocument();
    });
  });

  it("handles 'tools <category>' command", async () => {
    const mockTool1 = { name: "test_tool", description: "A test tool", category: "Test", tier: "free" };
    const mockTool2 = { name: "other_tool", description: "Other tool", category: "Other", tier: "free" };
    const byName = new Map([["test_tool", mockTool1], ["other_tool", mockTool2]]);
    const grouped = new Map([["Test", [mockTool1]], ["Other", [mockTool2]]]);

    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [mockTool1, mockTool2],
      byName,
      grouped,
      categories: ["Test", "Other"],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");
    fireEvent.change(input, { target: { value: "tools test" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText(/\[Test\]/)).toBeInTheDocument();
      expect(screen.getByText(/test_tool/)).toBeInTheDocument();
      expect(screen.queryByText(/\[Other\]/)).not.toBeInTheDocument();
      expect(screen.queryByText(/other_tool/)).not.toBeInTheDocument();
    });
  });

  it("handles unknown command", async () => {
    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [],
      byName: new Map(),
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");
    fireEvent.change(input, { target: { value: "unknown_cmd" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText(/Unknown command: "unknown_cmd"/i)).toBeInTheDocument();
  });

  it("renders ToolFormEntry on valid tool name", async () => {
    const mockTool = { name: "test_tool", description: "A test tool", category: "Test", tier: "free" };
    const byName = new Map([["test_tool", mockTool]]);

    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [mockTool],
      byName,
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");
    fireEvent.change(input, { target: { value: "test_tool" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByTestId("tool-form-test_tool")).toBeInTheDocument();
  });

  it("handles successful tool execution", async () => {
    const mockTool = { name: "test_tool", description: "A test tool", category: "Test", tier: "free" };
    const byName = new Map([["test_tool", mockTool]]);

    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [mockTool],
      byName,
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    vi.mocked(apiClient.callTool).mockResolvedValue({ content: [], isError: false });
    vi.mocked(apiClient.parseToolResult).mockReturnValue({ success: true, value: 42 });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");
    fireEvent.change(input, { target: { value: "test_tool" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Click submit in mock ToolForm
    const submitBtn = await screen.findByText("Submit test_tool");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // It should display JSON output
      expect(screen.getByText(/"success"/)).toBeInTheDocument();
      expect(screen.getByText(/42/)).toBeInTheDocument();
    });
  });

  it("handles tool execution error", async () => {
    const mockTool = { name: "test_tool", description: "A test tool", category: "Test", tier: "free" };
    const byName = new Map([["test_tool", mockTool]]);

    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [mockTool],
      byName,
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    vi.mocked(apiClient.callTool).mockRejectedValue(new Error("Test error message"));

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");
    fireEvent.change(input, { target: { value: "test_tool" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Click submit in mock ToolForm
    const submitBtn = await screen.findByText("Submit test_tool");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/error:/)).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });
  });

  it("supports command history (up/down arrows)", async () => {
    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [],
      byName: new Map(),
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");

    // Command 1
    fireEvent.change(input, { target: { value: "cmd1" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Command 2
    fireEvent.change(input, { target: { value: "cmd2" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Press Up twice
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("cmd2");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("cmd1");

    // Press Down once
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("cmd2");

    // Press Down again (clears)
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("");
  });

  it("supports autocompletion (Tab)", async () => {
    const mockTool1 = { name: "test_tool", description: "A test tool", category: "Test", tier: "free" };
    const mockTool2 = { name: "test_other", description: "Other tool", category: "Test", tier: "free" };

    vi.mocked(useToolsHook.useTools).mockReturnValue({
      tools: [mockTool1, mockTool2],
      byName: new Map(),
      grouped: new Map(),
      categories: [],
      loading: false,
      error: null,
    });

    render(<PixelTerminal />);

    const input = screen.getByPlaceholderText("type a command or tool name…");

    // Type partial and press Tab
    fireEvent.change(input, { target: { value: "te" } });
    fireEvent.keyDown(input, { key: "Tab" });

    // Should complete to common prefix
    expect(input).toHaveValue("test_");

    // Output should show matches
    expect(await screen.findByText(/test_tool test_other/)).toBeInTheDocument();
  });
});
