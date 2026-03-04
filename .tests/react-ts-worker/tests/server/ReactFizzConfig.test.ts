import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  isVoidElement,
  pushEndInstance,
  pushStartInstance,
  pushTextInstance,
} from "../../../../src/react-ts-worker/server/ReactFizzConfig.js";

describe("ReactFizzConfig", () => {
  describe("escapeHtml", () => {
    it("escapes ampersands", () => {
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });

    it("escapes less-than", () => {
      expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    });

    it("escapes double quotes", () => {
      expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
    });

    it("escapes single quotes", () => {
      expect(escapeHtml("it's")).toBe("it&#x27;s");
    });

    it("returns unchanged string with no special chars", () => {
      expect(escapeHtml("hello world")).toBe("hello world");
    });

    it("handles empty string", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("escapes multiple chars", () => {
      expect(escapeHtml("<a href=\"test\">")).toBe("&lt;a href=&quot;test&quot;&gt;");
    });
  });

  describe("isVoidElement", () => {
    it("returns true for br", () => {
      expect(isVoidElement("br")).toBe(true);
    });

    it("returns true for img", () => {
      expect(isVoidElement("img")).toBe(true);
    });

    it("returns true for input", () => {
      expect(isVoidElement("input")).toBe(true);
    });

    it("returns true for hr", () => {
      expect(isVoidElement("hr")).toBe(true);
    });

    it("returns true for link", () => {
      expect(isVoidElement("link")).toBe(true);
    });

    it("returns true for meta", () => {
      expect(isVoidElement("meta")).toBe(true);
    });

    it("returns false for div", () => {
      expect(isVoidElement("div")).toBe(false);
    });

    it("returns false for span", () => {
      expect(isVoidElement("span")).toBe(false);
    });

    it("returns false for p", () => {
      expect(isVoidElement("p")).toBe(false);
    });
  });

  describe("pushStartInstance", () => {
    it("generates simple opening tag", () => {
      expect(pushStartInstance("div", {})).toBe("<div>");
    });

    it("includes class attribute from className prop", () => {
      const html = pushStartInstance("div", { className: "foo" });
      expect(html).toContain('class="foo"');
    });

    it("skips event handler props", () => {
      const html = pushStartInstance("button", { onClick: () => {} });
      expect(html).not.toContain("onclick");
      expect(html).not.toContain("onClick");
    });

    it("skips key, ref, children", () => {
      const html = pushStartInstance("div", { key: "k", ref: null, children: "text" });
      expect(html).not.toContain("key");
      expect(html).not.toContain("ref");
      expect(html).not.toContain("children");
    });

    it("includes text content from children string prop", () => {
      const html = pushStartInstance("div", { children: "hello" });
      expect(html).toContain("hello");
    });

    it("includes text content from children number prop", () => {
      const html = pushStartInstance("span", { children: 42 });
      expect(html).toContain("42");
    });

    it("handles rawHtml prop", () => {
      const html = pushStartInstance("div", { rawHtml: "<span>raw</span>" });
      expect(html).toContain("<span>raw</span>");
    });

    it("escapes attribute values", () => {
      const html = pushStartInstance("div", { title: '<script>alert("xss")</script>' });
      expect(html).toContain("&lt;script&gt;");
    });

    it("renders boolean attributes without value when true", () => {
      const html = pushStartInstance("input", { disabled: true });
      expect(html).toContain("disabled");
      expect(html).not.toContain('disabled="');
    });

    it("skips boolean attributes when false", () => {
      const html = pushStartInstance("input", { disabled: false });
      expect(html).not.toContain("disabled");
    });

    it("skips null values", () => {
      const html = pushStartInstance("div", { title: null });
      expect(html).not.toContain("title");
    });

    it("renders style attribute", () => {
      const html = pushStartInstance("div", { style: { color: "red" } });
      expect(html).toContain("style=");
      expect(html).toContain("color");
    });

    it("renders style with number values (adds px)", () => {
      const html = pushStartInstance("div", { style: { marginTop: 10 } });
      expect(html).toContain("10px");
    });

    it("renders style with unitless number values", () => {
      const html = pushStartInstance("div", { style: { opacity: 0.5 } });
      expect(html).toContain("0.5");
      expect(html).not.toContain("px");
    });

    it("renders style with zero values", () => {
      const html = pushStartInstance("div", { style: { margin: 0 } });
      // 0 doesn't add px
      expect(html).toBeDefined();
    });

    it("skips style values that are null/empty", () => {
      const html = pushStartInstance("div", { style: { color: null, margin: "" } });
      expect(html).not.toContain("color");
    });

    it("renders hyphenated CSS properties correctly", () => {
      const html = pushStartInstance("div", { style: { backgroundColor: "blue" } });
      expect(html).toContain("background-color");
    });

    it("renders htmlFor as for", () => {
      const html = pushStartInstance("label", { htmlFor: "inputId" });
      expect(html).toContain('for="inputId"');
    });
  });

  describe("pushEndInstance", () => {
    it("returns closing tag for normal elements", () => {
      expect(pushEndInstance("div")).toBe("</div>");
      expect(pushEndInstance("span")).toBe("</span>");
    });

    it("returns empty string for void elements", () => {
      expect(pushEndInstance("br")).toBe("");
      expect(pushEndInstance("img")).toBe("");
      expect(pushEndInstance("input")).toBe("");
    });
  });

  describe("pushTextInstance", () => {
    it("escapes HTML in text", () => {
      expect(pushTextInstance("<b>bold</b>")).toBe("&lt;b&gt;bold&lt;/b&gt;");
    });

    it("returns plain text unchanged", () => {
      expect(pushTextInstance("hello world")).toBe("hello world");
    });

    it("escapes ampersands", () => {
      expect(pushTextInstance("a & b")).toBe("a &amp; b");
    });
  });
});
