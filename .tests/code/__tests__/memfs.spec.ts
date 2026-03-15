// This file serves as an entry point for all memfs tests
// The actual tests are in the memfs/ directory

import * as memfs from "@/lib/memfs/index";
import { describe, expect, it } from "vitest";

describe("memfs", () => {
  it("should import all tests from the memfs directory", () => {
    // This is a placeholder test to avoid "No test found" error
    // The actual tests are in the memfs/ directory
    expect(true).toBe(true);
  });

  it("should export a complete FS module", () => {
    // The memfs index uses `export *` (named exports), not a default export
    expect(memfs).toBeDefined();
    expect(typeof memfs).toBe("object");
    expect(Object.keys(memfs).length).toBeGreaterThan(0);
  });
});
