import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPosts,
  getPostBySlug,
} from "../../src/block-website/src/core/reducers";
import type { BlogPost } from "../../src/block-website/src/core/types";

const BASE = "https://edge.spike.land";

function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    slug: "test-post",
    title: "Test Post",
    description: "A test post",
    primer: "Primer text",
    date: "2026-01-01",
    author: "Author",
    category: "tech",
    tags: ["javascript", "testing"],
    featured: false,
    heroImage: null,
    content: "Content here",
    ...overrides,
  };
}

describe("getPosts", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns posts from the API", async () => {
    const posts = [makePost({ slug: "a" }), makePost({ slug: "b" })];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => posts,
    } as Response);

    const result = await getPosts();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/blog`);
    expect(result).toHaveLength(2);
    expect(result[0]!.slug).toBe("a");
  });

  it("returns empty array when fetch fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const result = await getPosts();

    expect(result).toEqual([]);
  });

  it("filters posts by tag", async () => {
    const posts = [
      makePost({ slug: "a", tags: ["javascript"] }),
      makePost({ slug: "b", tags: ["css"] }),
      makePost({ slug: "c", tags: ["javascript", "testing"] }),
    ];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => posts,
    } as Response);

    const result = await getPosts({ tag: "javascript" });

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.slug)).toEqual(["a", "c"]);
  });

  it("filters posts by category", async () => {
    const posts = [
      makePost({ slug: "a", category: "tech" }),
      makePost({ slug: "b", category: "design" }),
    ];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => posts,
    } as Response);

    const result = await getPosts({ category: "tech" });

    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe("a");
  });

  it("limits the number of posts returned", async () => {
    const posts = [
      makePost({ slug: "a" }),
      makePost({ slug: "b" }),
      makePost({ slug: "c" }),
    ];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => posts,
    } as Response);

    const result = await getPosts({ limit: 2 });

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("applies tag, category, and limit together", async () => {
    const posts = [
      makePost({ slug: "a", category: "tech", tags: ["js"] }),
      makePost({ slug: "b", category: "tech", tags: ["js"] }),
      makePost({ slug: "c", category: "tech", tags: ["css"] }),
      makePost({ slug: "d", category: "design", tags: ["js"] }),
    ];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => posts,
    } as Response);

    const result = await getPosts({ tag: "js", category: "tech", limit: 1 });

    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe("a");
  });

  it("returns all posts when no options provided", async () => {
    const posts = [makePost()];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => posts,
    } as Response);

    const result = await getPosts({});

    expect(result).toHaveLength(1);
  });
});

describe("getPostBySlug", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the post when found", async () => {
    const post = makePost({ slug: "my-post" });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => post,
    } as Response);

    const result = await getPostBySlug("my-post");

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/blog/my-post`);
    expect(result).toEqual(post);
  });

  it("returns undefined when post not found (non-ok response)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const result = await getPostBySlug("missing-post");

    expect(result).toBeUndefined();
  });
});
