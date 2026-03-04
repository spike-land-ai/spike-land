import { describe, expect, it } from "vitest";
import { renderToString, renderToReadableStream } from "../../../../src/react-ts-worker/react-dom/server.js";
import { createElement } from "../../../../src/react-ts-worker/react/index.js";

describe("react-dom/server re-exports", () => {
  it("exports renderToString", () => {
    expect(typeof renderToString).toBe("function");
  });

  it("exports renderToReadableStream", () => {
    expect(typeof renderToReadableStream).toBe("function");
  });

  it("renderToString works via re-export", () => {
    const html = renderToString(createElement("div", null, "test"));
    expect(html).toContain("test");
  });
});
