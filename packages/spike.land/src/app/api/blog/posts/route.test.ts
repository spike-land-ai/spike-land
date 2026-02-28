import { afterEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";
import * as blogModule from "@/lib/blog/get-posts";
import * as nextServer from "next/server";

vi.mock("@/lib/blog/get-posts");

const mockRequest = new Request(
  "https://spike.land/api/blog/posts?page=1&limit=10",
);

describe("GET /api/blog/posts", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("returns 200 with posts", async () => {
    vi.mocked(blogModule.getAllPosts).mockReturnValue([
      {
        slug: "post-1",
        frontmatter: { title: "Post 1", description: "Desc 1" },
      } as any,
    ]);

    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.posts).toHaveLength(1);
    expect(json.posts[0].slug).toBe("post-1");
  });

  test("returns 500 when data layer (getAllPosts) throws an error", async () => {
    vi.mocked(blogModule.getAllPosts).mockImplementation(() => {
      throw new Error("File system read error");
    });

    const response = await GET(mockRequest);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch blog posts",
    });
  });

  test("returns 500 on unhandled outer error without stack trace", async () => {
    // Spy on json to simulate error in outer catch
    const nextResponseSpy = vi.spyOn(nextServer.NextResponse, "json")
      .mockImplementationOnce(() => {
        throw new Error("Unexpected outer error");
      });

    const response = await GET(mockRequest);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    nextResponseSpy.mockRestore();
  });
});
