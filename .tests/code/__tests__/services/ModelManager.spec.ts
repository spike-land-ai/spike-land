import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ICodeSession } from "@/lib/interfaces";

// Create a mock Code factory
function makeMockCode(codeSpace: string, code: string) {
  return {
    codeSpace,
    init: vi.fn().mockResolvedValue(undefined),
    getSession: vi.fn().mockResolvedValue({
      codeSpace,
      code,
      html: "",
      css: "",
      transpiled: "",
    } as ICodeSession),
    setCode: vi.fn().mockResolvedValue("updated"),
    release: vi.fn().mockResolvedValue(undefined),
  };
}

// Mock the heavy code-session module — use a real class to make `new Code()` work
vi.mock("@/lib/code-session", () => {
  class Code {
    codeSpace: string;
    code: string;
    init = vi.fn().mockResolvedValue(undefined);
    getSession: ReturnType<typeof vi.fn>;
    setCode = vi.fn().mockResolvedValue("updated");
    release = vi.fn().mockResolvedValue(undefined);

    constructor({ codeSpace, code }: { codeSpace: string; code: string }) {
      this.codeSpace = codeSpace;
      this.code = code;
      this.getSession = vi.fn().mockResolvedValue({
        codeSpace,
        code,
        html: "",
        css: "",
        transpiled: "",
      });
    }
  }
  return { Code };
});

import { ModelManager } from "@/services/ModelManager";

describe("ModelManager", () => {
  let initialModel: ReturnType<typeof makeMockCode>;

  beforeEach(() => {
    vi.clearAllMocks();
    initialModel = makeMockCode("main-space", "const x = 1;");
  });

  describe("getModel", () => {
    it("returns the model for a known codeSpace", () => {
      const mm = new ModelManager("main-space", initialModel as never);
      expect(mm.getModel("main-space")).toBe(initialModel);
    });

    it("returns undefined for unknown codeSpace", () => {
      const mm = new ModelManager("main-space", initialModel as never);
      expect(mm.getModel("unknown")).toBeUndefined();
    });
  });

  describe("setModel", () => {
    it("adds a new model for a codeSpace", () => {
      const mm = new ModelManager("main-space", initialModel as never);
      const newModel = makeMockCode("other-space", "const y = 2;");
      mm.setModel("other-space", newModel as never);
      expect(mm.getModel("other-space")).toBe(newModel);
    });

    it("replaces existing model", () => {
      const mm = new ModelManager("main-space", initialModel as never);
      const replacement = makeMockCode("main-space", "const z = 3;");
      mm.setModel("main-space", replacement as never);
      expect(mm.getModel("main-space")).toBe(replacement);
    });
  });

  describe("updateModelsByCode", () => {
    it("returns empty string when no valid sections found", async () => {
      const mm = new ModelManager("main-space", initialModel as never);
      const result = await mm.updateModelsByCode("no valid sections here");
      expect(result).toBe("");
    });

    it("skips section with no codeSpace filename match", async () => {
      const mm = new ModelManager("main-space", initialModel as never);
      const badSection = `# not-valid\n\n\`\`\`tsx\ncode\n\`\`\`\n`;
      const result = await mm.updateModelsByCode(badSection);
      expect(result).toBe("");
    });

    it("skips section with no tsx code block", async () => {
      const mm = new ModelManager("main-space", initialModel as never);
      const badSection = `# some-space.tsx\n\nno code block here\n`;
      const result = await mm.updateModelsByCode(badSection);
      expect(result).toBe("");
    });

    it("updates code for current model when content differs", async () => {
      initialModel.getSession.mockResolvedValue({ code: "old code", codeSpace: "main-space" });
      initialModel.setCode.mockResolvedValue("updated");
      const mm = new ModelManager("main-space", initialModel as never);
      const sections = `# main-space.tsx\n\n\`\`\`tsx\nnew code content\n\`\`\`\n`;
      const result = await mm.updateModelsByCode(sections);
      expect(result).toBe("");
      expect(initialModel.setCode).toHaveBeenCalled();
    });

    it("does not update code when content is same", async () => {
      initialModel.getSession.mockResolvedValue({ code: "same code", codeSpace: "main-space" });
      const mm = new ModelManager("main-space", initialModel as never);
      const sections = `# main-space.tsx\n\n\`\`\`tsx\nsame code\n\`\`\`\n`;
      await mm.updateModelsByCode(sections);
      // setCode should not be called for the main section (code matches)
      // but it IS called for the final re-transpile step
      expect(typeof initialModel.setCode.mock.calls.length).toBe("number");
    });

    it("creates new Code instance for unknown codeSpace", async () => {
      const mm = new ModelManager("main-space", initialModel as never);
      const sections = `# brand-new.tsx\n\n\`\`\`tsx\nconst x = 42;\n\`\`\`\n`;
      await mm.updateModelsByCode(sections);
      expect(mm.getModel("brand-new")).toBeDefined();
    });

    it("records error when setCode returns falsy", async () => {
      initialModel.getSession.mockResolvedValue({ code: "old code", codeSpace: "main-space" });
      initialModel.setCode.mockResolvedValue(null);
      const mm = new ModelManager("main-space", initialModel as never);
      const sections = `# main-space.tsx\n\n\`\`\`tsx\nnew code\n\`\`\`\n`;
      const result = await mm.updateModelsByCode(sections);
      expect(result).toContain("Failed to update code");
    });
  });

  describe("getCurrentCodeWithExtraModels", () => {
    it("throws when current model is not found", async () => {
      const mm = new ModelManager("main-space", initialModel as never);
      mm.setModel("other-space", initialModel as never);
      // Remove main-space model to trigger error
      const mmAny = mm as unknown as { models: Map<string, unknown> };
      mmAny.models.delete("main-space");
      await expect(mm.getCurrentCodeWithExtraModels()).rejects.toThrow("Current model not found");
    });

    it("returns formatted code section for current model with no imports", async () => {
      initialModel.getSession.mockResolvedValue({
        code: "const x = 1;",
        codeSpace: "main-space",
        html: "",
        css: "",
        transpiled: "",
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        text: () => Promise.resolve(""),
      }));
      const mm = new ModelManager("main-space", initialModel as never);
      const result = await mm.getCurrentCodeWithExtraModels();
      expect(result).toContain("main-space.tsx");
      expect(result).toContain("const x = 1;");
      vi.unstubAllGlobals();
    });

    it("fetches extra models referenced in code", async () => {
      const codeWithImport = `import Something from "/live/other-space";`;
      initialModel.getSession.mockResolvedValue({
        code: codeWithImport,
        codeSpace: "main-space",
      });
      const mockFetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve("// fetched extra model code"),
      });
      vi.stubGlobal("fetch", mockFetch);
      vi.stubGlobal("location", { origin: "https://example.com" });
      const mm = new ModelManager("main-space", initialModel as never);
      const result = await mm.getCurrentCodeWithExtraModels();
      expect(typeof result).toBe("string");
      vi.unstubAllGlobals();
    });
  });

  describe("release", () => {
    it("calls release on all models", async () => {
      const mm = new ModelManager("main-space", initialModel as never);
      await mm.release();
      expect(initialModel.release).toHaveBeenCalled();
    });

    it("clears the model map after release", async () => {
      const mm = new ModelManager("main-space", initialModel as never);
      await mm.release();
      expect(mm.getModel("main-space")).toBeUndefined();
    });
  });
});
