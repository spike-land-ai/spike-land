import { describe, expect, it } from "vitest";
import {
  createRoot,
  hydrateRoot,
} from "../../../../src/core/react-engine/core-logic/react-dom/index.js";

describe("react-dom/index re-exports", () => {
  it("exports createRoot", () => {
    expect(typeof createRoot).toBe("function");
  });

  it("exports hydrateRoot", () => {
    expect(typeof hydrateRoot).toBe("function");
  });
});
