import { describe, expect, it } from "vitest";
import {
  isAllowedBlogImageSrc,
  sanitizeBlogImageSrc,
} from "../../src/core/block-website/core-logic/blog-image-policy";

describe("blog image policy", () => {
  it("allows local and approved image sources", () => {
    expect(isAllowedBlogImageSrc("/blog/hero.png")).toBe(true);
    expect(isAllowedBlogImageSrc("./hero.png")).toBe(true);
    expect(isAllowedBlogImageSrc("data:image/png;base64,abc")).toBe(true);
    expect(isAllowedBlogImageSrc("https://avatars.githubusercontent.com/u/1")).toBe(true);
    expect(isAllowedBlogImageSrc("https://demo.r2.dev/image.png")).toBe(true);
    expect(isAllowedBlogImageSrc("https://bucket.r2.cloudflarestorage.com/image.png")).toBe(true);
    expect(isAllowedBlogImageSrc("https://image-studio-mcp.spike.land/image.png")).toBe(true);
  });

  it("blocks disallowed remote sources", () => {
    expect(isAllowedBlogImageSrc("https://placehold.co/600x300")).toBe(false);
    expect(isAllowedBlogImageSrc("https://example.com/image.png")).toBe(false);
    expect(isAllowedBlogImageSrc("javascript:alert(1)")).toBe(false);
  });

  it("returns null for blocked sources when sanitizing", () => {
    expect(sanitizeBlogImageSrc(" https://placehold.co/600x300 ")).toBeNull();
    expect(sanitizeBlogImageSrc(" /blog/hero.png ")).toBe("/blog/hero.png");
  });
});
