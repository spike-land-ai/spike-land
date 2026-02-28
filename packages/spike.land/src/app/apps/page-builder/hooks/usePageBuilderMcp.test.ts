import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePageBuilderMcp } from "./usePageBuilderMcp";

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    data: undefined,
    error: undefined,
    isLoading: false,
    reset: vi.fn(),
  }),
}));

describe("usePageBuilderMcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a mutations object", () => {
    const { result } = renderHook(() => usePageBuilderMcp());
    expect(result.current).toHaveProperty("mutations");
  });

  describe("page mutations", () => {
    it("exposes createPage mutation", () => {
      const { result } = renderHook(() => usePageBuilderMcp());
      expect(result.current.mutations.createPage).toBeDefined();
      expect(result.current.mutations.createPage.mutate).toBeInstanceOf(Function);
      expect(result.current.mutations.createPage.mutateAsync).toBeInstanceOf(Function);
    });

    it("exposes updatePage mutation", () => {
      const { result } = renderHook(() => usePageBuilderMcp());
      expect(result.current.mutations.updatePage).toBeDefined();
      expect(result.current.mutations.updatePage.mutate).toBeInstanceOf(Function);
    });

    it("exposes publishPage mutation", () => {
      const { result } = renderHook(() => usePageBuilderMcp());
      expect(result.current.mutations.publishPage).toBeDefined();
      expect(result.current.mutations.publishPage.mutate).toBeInstanceOf(Function);
    });
  });

  describe("block mutations", () => {
    it("exposes addBlock mutation", () => {
      const { result } = renderHook(() => usePageBuilderMcp());
      expect(result.current.mutations.addBlock).toBeDefined();
      expect(result.current.mutations.addBlock.mutate).toBeInstanceOf(Function);
    });

    it("exposes updateBlock mutation", () => {
      const { result } = renderHook(() => usePageBuilderMcp());
      expect(result.current.mutations.updateBlock).toBeDefined();
      expect(result.current.mutations.updateBlock.mutate).toBeInstanceOf(Function);
    });

    it("exposes reorderBlocks mutation", () => {
      const { result } = renderHook(() => usePageBuilderMcp());
      expect(result.current.mutations.reorderBlocks).toBeDefined();
      expect(result.current.mutations.reorderBlocks.mutate).toBeInstanceOf(Function);
    });
  });

  describe("AI mutations", () => {
    it("exposes aiGeneratePage mutation", () => {
      const { result } = renderHook(() => usePageBuilderMcp());
      expect(result.current.mutations.aiGeneratePage).toBeDefined();
      expect(result.current.mutations.aiGeneratePage.mutate).toBeInstanceOf(Function);
    });

    it("exposes aiEnhanceBlock mutation", () => {
      const { result } = renderHook(() => usePageBuilderMcp());
      expect(result.current.mutations.aiEnhanceBlock).toBeDefined();
      expect(result.current.mutations.aiEnhanceBlock.mutate).toBeInstanceOf(Function);
    });

    it("exposes aiCreateTheme mutation", () => {
      const { result } = renderHook(() => usePageBuilderMcp());
      expect(result.current.mutations.aiCreateTheme).toBeDefined();
      expect(result.current.mutations.aiCreateTheme.mutate).toBeInstanceOf(Function);
    });
  });

  it("calls useMcpMutation for all 9 operations", async () => {
    const { useMcpMutation } = await import("@/lib/mcp/client/hooks/use-mcp-mutation");
    renderHook(() => usePageBuilderMcp());
    expect(useMcpMutation).toHaveBeenCalledTimes(9);
  });

  it("calls useMcpMutation with correct tool names", async () => {
    const { useMcpMutation } = await import("@/lib/mcp/client/hooks/use-mcp-mutation");
    renderHook(() => usePageBuilderMcp());
    const calls = (useMcpMutation as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: unknown[]) => c[0],
    );
    expect(calls).toContain("create_page");
    expect(calls).toContain("update_page");
    expect(calls).toContain("publish_page");
    expect(calls).toContain("add_block");
    expect(calls).toContain("update_block");
    expect(calls).toContain("reorder_blocks");
    expect(calls).toContain("ai_generate_page");
    expect(calls).toContain("ai_enhance_block");
    expect(calls).toContain("ai_create_theme");
  });

  it("mutations have isLoading false by default", () => {
    const { result } = renderHook(() => usePageBuilderMcp());
    const { mutations } = result.current;
    expect(mutations.createPage.isLoading).toBe(false);
    expect(mutations.updatePage.isLoading).toBe(false);
    expect(mutations.publishPage.isLoading).toBe(false);
    expect(mutations.addBlock.isLoading).toBe(false);
    expect(mutations.updateBlock.isLoading).toBe(false);
    expect(mutations.reorderBlocks.isLoading).toBe(false);
    expect(mutations.aiGeneratePage.isLoading).toBe(false);
    expect(mutations.aiEnhanceBlock.isLoading).toBe(false);
    expect(mutations.aiCreateTheme.isLoading).toBe(false);
  });

  it("mutations have no error by default", () => {
    const { result } = renderHook(() => usePageBuilderMcp());
    const { mutations } = result.current;
    expect(mutations.createPage.error).toBeUndefined();
    expect(mutations.aiGeneratePage.error).toBeUndefined();
  });
});
