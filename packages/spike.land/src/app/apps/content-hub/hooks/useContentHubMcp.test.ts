import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useContentHubMcp } from "./useContentHubMcp";

const mockMutate = vi.fn();
const mockMutateAsync = vi.fn();
const mockReset = vi.fn();

const makeMockMutation = () => ({
  mutate: mockMutate,
  mutateAsync: mockMutateAsync,
  data: undefined,
  error: undefined,
  isLoading: false,
  reset: mockReset,
});

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: vi.fn().mockImplementation(() => makeMockMutation()),
}));

describe("useContentHubMcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a mutations object with all expected keys", () => {
    const { result } = renderHook(() => useContentHubMcp());

    expect(result.current.mutations).toHaveProperty("createPost");
    expect(result.current.mutations).toHaveProperty("publishPost");
    expect(result.current.mutations).toHaveProperty("listPosts");
    expect(result.current.mutations).toHaveProperty("createNewsletter");
    expect(result.current.mutations).toHaveProperty("sendNewsletter");
    expect(result.current.mutations).toHaveProperty("manageSubscribers");
  });

  it("each mutation has mutate, mutateAsync, data, error, isLoading, and reset", () => {
    const { result } = renderHook(() => useContentHubMcp());

    const mutationKeys = [
      "createPost",
      "publishPost",
      "listPosts",
      "createNewsletter",
      "sendNewsletter",
      "manageSubscribers",
    ] as const;

    for (const key of mutationKeys) {
      const mutation = result.current.mutations[key];
      expect(mutation).toHaveProperty("mutate");
      expect(mutation).toHaveProperty("mutateAsync");
      expect(mutation).toHaveProperty("data");
      expect(mutation).toHaveProperty("error");
      expect(mutation).toHaveProperty("isLoading");
      expect(mutation).toHaveProperty("reset");
    }
  });

  it("calls useMcpMutation with correct tool names", async () => {
    const { useMcpMutation } = await import(
      "@/lib/mcp/client/hooks/use-mcp-mutation"
    );

    renderHook(() => useContentHubMcp());

    const toolNames = (useMcpMutation as ReturnType<typeof vi.fn>).mock.calls.map(
      (call: unknown[]) => call[0],
    );

    expect(toolNames).toContain("create_post");
    expect(toolNames).toContain("publish_post");
    expect(toolNames).toContain("list_posts");
    expect(toolNames).toContain("create_newsletter");
    expect(toolNames).toContain("send_newsletter");
    expect(toolNames).toContain("manage_subscribers");
  });

  it("mutations start with isLoading false and no data or error", () => {
    const { result } = renderHook(() => useContentHubMcp());

    const { createPost, publishPost, listPosts } = result.current.mutations;

    expect(createPost.isLoading).toBe(false);
    expect(createPost.data).toBeUndefined();
    expect(createPost.error).toBeUndefined();

    expect(publishPost.isLoading).toBe(false);
    expect(publishPost.data).toBeUndefined();
    expect(publishPost.error).toBeUndefined();

    expect(listPosts.isLoading).toBe(false);
    expect(listPosts.data).toBeUndefined();
    expect(listPosts.error).toBeUndefined();
  });

  it("calling createPost.mutate invokes the mock mutate function", () => {
    const { result } = renderHook(() => useContentHubMcp());

    result.current.mutations.createPost.mutate({ post: { title: "Test" } });

    expect(mockMutate).toHaveBeenCalledWith({ post: { title: "Test" } });
  });

  it("calling publishPost.mutate invokes the mock mutate function", () => {
    const { result } = renderHook(() => useContentHubMcp());

    result.current.mutations.publishPost.mutate({ postId: "abc123" });

    expect(mockMutate).toHaveBeenCalledWith({ postId: "abc123" });
  });

  it("calling reset on a mutation invokes the mock reset function", () => {
    const { result } = renderHook(() => useContentHubMcp());

    result.current.mutations.createNewsletter.reset();

    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
