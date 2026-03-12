/**
 * Tests for gates/engine.ts
 */

import { describe, expect, it } from "vitest";
import {
  computeOverallStatus,
  countChanges,
  formatGateResults,
  getAddedLines,
  getBuiltinRules,
  getChangedFiles,
  getRuleByName,
  runGates,
} from "../../../src/mcp-tools/bazdmeg/core-logic/engine.js";
import { buildDiff } from "../__test-utils__/fixtures.js";
import type { GateResult, RuleContext } from "../../../src/mcp-tools/bazdmeg/core-logic/types.js";

function makeContext(overrides: Partial<RuleContext> = {}): RuleContext {
  return {
    diff: "",
    files: [],
    additions: 0,
    deletions: 0,
    prTitle: "Test PR",
    prBody: "This is a test PR with enough description to pass the quality gate check.",
    claudeMdRules: [],
    ...overrides,
  };
}

describe("getAddedLines", () => {
  it("extracts lines starting with +", () => {
    const diff = "+added line\n-removed line\n+another added\n+++header";
    expect(getAddedLines(diff)).toEqual(["+added line", "+another added"]);
  });

  it("returns empty for no additions", () => {
    expect(getAddedLines("-only removals\n---header")).toEqual([]);
  });
});

describe("getChangedFiles", () => {
  it("extracts file paths from diff headers", () => {
    const diff = buildDiff([
      { path: "src/index.ts", added: ["const x = 1;"] },
      { path: "src/util.ts", added: ["export function foo() {}"] },
    ]);
    const files = getChangedFiles(diff);
    expect(files).toContain("src/index.ts");
    expect(files).toContain("src/util.ts");
  });
});

describe("countChanges", () => {
  it("counts additions and deletions", () => {
    const diff = "+new line 1\n+new line 2\n-old line 1\n+++header\n---header";
    expect(countChanges(diff)).toEqual({ additions: 2, deletions: 1 });
  });
});

describe("getBuiltinRules", () => {
  it("returns 6 rules", () => {
    expect(getBuiltinRules()).toHaveLength(6);
  });

  it("includes workspace scope compliance gate", () => {
    const names = getBuiltinRules().map((r) => r.name);
    expect(names).toContain("Workspace Scope Compliance");
  });
});

describe("getRuleByName", () => {
  it("finds a rule by name", () => {
    const rule = getRuleByName("Change Size");
    expect(rule).toBeDefined();
    expect(rule?.name).toBe("Change Size");
  });

  it("returns undefined for unknown rule", () => {
    expect(getRuleByName("NonExistent")).toBeUndefined();
  });
});

describe("Unit Tests Present gate", () => {
  const rule = getRuleByName("Unit Tests Present");

  it("GREEN when test files included", () => {
    const result = rule.check(makeContext({ files: ["src/index.ts", "src/index.test.ts"] }));
    expect(result.status).toBe("GREEN");
  });

  it("GREEN when no code files changed", () => {
    const result = rule.check(makeContext({ files: ["README.md", "package.json"] }));
    expect(result.status).toBe("GREEN");
  });

  it("RED when code changed without tests", () => {
    const result = rule.check(makeContext({ files: ["src/index.ts"] }));
    expect(result.status).toBe("RED");
  });
});

describe("TypeScript Strict Compliance gate", () => {
  const rule = getRuleByName("TypeScript Strict Compliance");

  it("GREEN for clean code", () => {
    const diff = "+const x: string = 'hello';";
    const result = rule.check(makeContext({ diff }));
    expect(result.status).toBe("GREEN");
  });

  it("RED for `any` type", () => {
    const diff = "+function foo(x: any) {}";
    const result = rule.check(makeContext({ diff }));
    expect(result.status).toBe("RED");
  });

  it("RED for eslint-disable", () => {
    const diff = "+// eslint-disable-next-line no-console";
    const result = rule.check(makeContext({ diff }));
    expect(result.status).toBe("RED");
  });

  it("RED for ts-ignore", () => {
    const diff = "+// @ts-ignore";
    const result = rule.check(makeContext({ diff }));
    expect(result.status).toBe("RED");
  });
});

describe("PR Description Quality gate", () => {
  const rule = getRuleByName("PR Description Quality");

  it("GREEN for substantive description", () => {
    const result = rule.check(
      makeContext({
        prBody:
          "This PR implements the new authentication flow using OAuth2. It replaces the legacy session-based auth with JWT tokens.",
      }),
    );
    expect(result.status).toBe("GREEN");
  });

  it("YELLOW for brief description", () => {
    const result = rule.check(makeContext({ prBody: "Fix the auth bug that was found" }));
    expect(result.status).toBe("YELLOW");
  });

  it("RED for missing description", () => {
    const result = rule.check(makeContext({ prBody: null }));
    expect(result.status).toBe("RED");
  });

  it("RED for very short description", () => {
    const result = rule.check(makeContext({ prBody: "fix" }));
    expect(result.status).toBe("RED");
  });
});

describe("Security Patterns gate", () => {
  const rule = getRuleByName("Security Patterns");

  it("GREEN for clean code", () => {
    const diff = "+const config = loadConfig();";
    const result = rule.check(makeContext({ diff }));
    expect(result.status).toBe("GREEN");
  });

  it("RED for hardcoded API key", () => {
    const diff = "+const api_key = 'sk-1234567890abcdef';";
    const result = rule.check(makeContext({ diff }));
    expect(result.status).toBe("RED");
  });

  it("RED for innerHTML", () => {
    const diff = "+element.innerHTML = userInput;";
    const result = rule.check(makeContext({ diff }));
    expect(result.status).toBe("RED");
  });
});

describe("Change Size gate", () => {
  const rule = getRuleByName("Change Size");

  it("GREEN for small changes", () => {
    const result = rule.check(makeContext({ additions: 50, deletions: 20 }));
    expect(result.status).toBe("GREEN");
  });

  it("YELLOW for medium changes", () => {
    const result = rule.check(makeContext({ additions: 400, deletions: 200 }));
    expect(result.status).toBe("YELLOW");
  });

  it("RED for large changes", () => {
    const result = rule.check(makeContext({ additions: 800, deletions: 300 }));
    expect(result.status).toBe("RED");
  });
});

describe("Workspace Scope Compliance gate", () => {
  const rule = getRuleByName("Workspace Scope Compliance");

  it("GREEN when no restrictions", () => {
    const result = rule.check(makeContext({ files: ["any/file.ts"] }));
    expect(result.status).toBe("GREEN");
  });

  it("GREEN when all files in scope", () => {
    const result = rule.check(
      makeContext({
        files: ["packages/chess-engine/src/index.ts"],
        allowedPaths: ["packages/chess-engine/"],
      }),
    );
    expect(result.status).toBe("GREEN");
  });

  it("RED when files outside scope", () => {
    const result = rule.check(
      makeContext({
        files: ["packages/chess-engine/src/index.ts", "packages/spike-review/src/types.ts"],
        allowedPaths: ["packages/chess-engine/"],
      }),
    );
    expect(result.status).toBe("RED");
  });
});

describe("runGates", () => {
  it("runs all rules and returns results", () => {
    const rules = getBuiltinRules();
    const results = runGates(rules, makeContext());
    expect(results).toHaveLength(6);
    for (const r of results) {
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("status");
      expect(r).toHaveProperty("detail");
    }
  });
});

describe("computeOverallStatus", () => {
  it("RED if any RED", () => {
    const gates: GateResult[] = [
      { name: "A", status: "GREEN", detail: "" },
      { name: "B", status: "RED", detail: "" },
    ];
    expect(computeOverallStatus(gates)).toBe("RED");
  });

  it("YELLOW if any YELLOW (no RED)", () => {
    const gates: GateResult[] = [
      { name: "A", status: "GREEN", detail: "" },
      { name: "B", status: "YELLOW", detail: "" },
    ];
    expect(computeOverallStatus(gates)).toBe("YELLOW");
  });

  it("GREEN if all GREEN", () => {
    const gates: GateResult[] = [
      { name: "A", status: "GREEN", detail: "" },
      { name: "B", status: "GREEN", detail: "" },
    ];
    expect(computeOverallStatus(gates)).toBe("GREEN");
  });
});

describe("formatGateResults", () => {
  it("produces markdown table", () => {
    const gates: GateResult[] = [
      {
        name: "Test Gate",
        status: "GREEN",
        detail: "All good",
      },
    ];
    const text = formatGateResults(gates);
    expect(text).toContain("BAZDMEG Quality Gates");
    expect(text).toContain("Test Gate");
    expect(text).toContain("All good");
    expect(text).toContain("Overall: GREEN");
    expect(text).toContain("All quality gates passing");
  });

  it("formats reports with RED status correctly", () => {
    const gates: GateResult[] = [{ name: "Tests", status: "RED", detail: "Missing" }];
    const output = formatGateResults(gates);
    expect(output).toContain("Overall: RED");
    expect(output).toContain("Issues must be addressed");
  });

  it("formats reports with YELLOW status correctly", () => {
    const gates: GateResult[] = [{ name: "Size", status: "YELLOW", detail: "Large" }];
    const output = formatGateResults(gates);
    expect(output).toContain("Overall: YELLOW");
    expect(output).toContain("Minor concerns noted");
  });
});

describe("Diff parsing edge cases", () => {
  it("getChangedFiles handles non-git diff headers", () => {
    const diff = "+++ b/src/only-plus.ts\n+ new line";
    const files = getChangedFiles(diff);
    expect(files).toEqual(["src/only-plus.ts"]);
  });

  it("detects @ts-nocheck and various security patterns", () => {
    const diff = [
      "+// @ts-nocheck",
      "+const password = '123';",
      "+const token = 'test-fake-value';",
    ].join("\n");
    const ctx = makeContext({ diff });
    const rules = getBuiltinRules();

    const complianceRule = rules.find((r) => r.name === "TypeScript Strict Compliance");
    expect(complianceRule.check(ctx).status).toBe("RED");
    expect(complianceRule.check(ctx).detail).toContain("@ts-nocheck");

    const securityRule = rules.find((r) => r.name === "Security Patterns");
    const res = securityRule.check(ctx);
    expect(res.status).toBe("RED");
    expect(res.detail).toContain("Hardcoded password");
    expect(res.detail).toContain("Potential secret/token");
  });
});

describe("Workspace scope edge cases", () => {
  it("Workspace Scope Compliance uses ellipsis for many files", () => {
    const ctx = makeContext({
      files: ["a.ts", "b.ts", "c.ts", "d.ts", "e.ts"],
      allowedPaths: ["src/"],
    });
    const rule = getBuiltinRules().find((r) => r.name === "Workspace Scope Compliance");
    const res = rule.check(ctx);
    expect(res.status).toBe("RED");
    expect(res.detail).toContain("...");
  });
});
