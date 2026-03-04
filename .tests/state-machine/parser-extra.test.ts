/**
 * Additional parser tests to cover uncovered branches
 *
 * Targets: lines 138 (multiplication), 246 (NaN check), 260 (unexpected char),
 * 307 (trailing content error)
 */

import { describe, expect, it } from "vitest";
import { evaluateExpression, evaluateGuard } from "../../src/state-machine/parser.js";

describe("Parser extra branch coverage", () => {
  describe("multiplication operator", () => {
    it("evaluates multiplication", () => {
      expect(evaluateExpression("3 * 4", {})).toBe(12);
    });

    it("evaluates multiplication in compound expression", () => {
      expect(evaluateExpression("2 * 3 + 1", {})).toBe(7);
    });

    it("evaluates division", () => {
      expect(evaluateExpression("10 / 4", {})).toBe(2.5);
    });

    it("evaluates mixed mul and div", () => {
      expect(evaluateExpression("12 / 3 * 2", {})).toBe(8);
    });
  });

  describe("subtraction operator", () => {
    it("evaluates subtraction", () => {
      expect(evaluateExpression("10 - 3", {})).toBe(7);
    });

    it("evaluates subtraction chain", () => {
      expect(evaluateExpression("10 - 3 - 2", {})).toBe(5);
    });
  });

  describe("power operator", () => {
    it("evaluates power", () => {
      expect(evaluateExpression("2 ** 10", {})).toBe(1024);
    });

    it("evaluates power with context", () => {
      expect(evaluateExpression("context.base ** 2", { base: 5 })).toBe(25);
    });
  });

  describe("string escape sequences", () => {
    it("handles escaped double-quote string", () => {
      // The parser handles escape sequences in strings
      expect(evaluateExpression('"hello"', {})).toBe("hello");
    });

    it("handles single-quote string with escaped char", () => {
      expect(evaluateExpression("'test'", {})).toBe("test");
    });

    it("throws on unterminated double-quoted string", () => {
      expect(() => evaluateExpression('"unterminated', {})).toThrow(
        "unterminated string literal",
      );
    });

    it("throws on unterminated single-quoted string", () => {
      expect(() => evaluateExpression("'unterminated", {})).toThrow(
        "unterminated string literal",
      );
    });

    it("throws on escape at end of double-quoted string (line 195)", () => {
      // String with backslash at the very end (no char after escape)
      // '"hello\' — the backslash is followed by EOF
      expect(() => evaluateExpression('"hello\\', {})).toThrow(
        "unterminated string escape",
      );
    });

    it("throws on escape at end of single-quoted string (line 214-216)", () => {
      // Single-quote string with backslash at end
      expect(() => evaluateExpression("'hello\\", {})).toThrow(
        "unterminated string escape",
      );
    });

    it("handles escape sequence inside double-quoted string", () => {
      // backslash followed by a char (e.g., 'n') — the char is added
      // "hel\\nlo" → hel + n + lo = "helnlo"
      const result = evaluateExpression('"hel\\nlo"', {});
      expect(result).toBe("helnlo");
    });

    it("handles escape sequence inside single-quoted string", () => {
      const result = evaluateExpression("'hel\\nlo'", {});
      expect(result).toBe("helnlo");
    });
  });

  describe("number parsing", () => {
    it("handles negative numbers", () => {
      expect(evaluateExpression("-5", {})).toBe(-5);
    });

    it("handles float numbers", () => {
      expect(evaluateExpression("3.14", {})).toBe(3.14);
    });

    it("handles zero", () => {
      expect(evaluateExpression("0", {})).toBe(0);
    });

    it("throws on invalid number (NaN) - line 246", () => {
      // "." alone as a number won't work because parser checks for digit or '-' followed by digit
      // But "1.2.3" — multiple dots makes a NaN
      expect(() => evaluateExpression("1.2.3", {})).toThrow();
    });
  });

  describe("unexpected character error", () => {
    it("throws on unexpected character like @", () => {
      expect(() => evaluateExpression("@invalid", {})).toThrow("unexpected character");
    });

    it("throws on unexpected character #", () => {
      expect(() => evaluateExpression("# comment", {})).toThrow("unexpected character");
    });
  });

  describe("trailing content error", () => {
    it("throws when expression has trailing content", () => {
      expect(() => evaluateExpression("true false", {})).toThrow("unexpected trailing content");
    });

    it("throws when expression has trailing operators", () => {
      expect(() => evaluateExpression("5 + 3 extra", {})).toThrow();
    });
  });

  describe("null keyword", () => {
    it("evaluates null keyword", () => {
      expect(evaluateExpression("null", {})).toBe(null);
    });

    it("compares with null", () => {
      expect(evaluateExpression("context.value == null", { value: null })).toBe(true);
    });
  });

  describe("boolean keywords", () => {
    it("evaluates true", () => {
      expect(evaluateExpression("true", {})).toBe(true);
    });

    it("evaluates false", () => {
      expect(evaluateExpression("false", {})).toBe(false);
    });

    it("negates true", () => {
      expect(evaluateExpression("!true", {})).toBe(false);
    });

    it("double negation", () => {
      expect(evaluateExpression("!!false", {})).toBe(false);
    });
  });

  describe("context path resolution", () => {
    it("resolves nested context path", () => {
      expect(evaluateExpression("context.a.b.c", { a: { b: { c: 42 } } })).toBe(42);
    });

    it("returns undefined for missing path", () => {
      expect(evaluateExpression("context.missing.path", {})).toBeUndefined();
    });

    it("returns undefined when intermediate is null", () => {
      expect(evaluateExpression("context.a.b", { a: null })).toBeUndefined();
    });

    it("returns undefined when intermediate is a primitive", () => {
      expect(evaluateExpression("context.a.b", { a: 42 })).toBeUndefined();
    });
  });

  describe("event path access", () => {
    it("accesses nested event fields", () => {
      const ctx = { _event: { data: { id: 123 } } };
      expect(evaluateExpression("event.data.id", ctx)).toBe(123);
    });

    it("returns undefined for missing event field", () => {
      const ctx = { _event: null };
      expect(evaluateExpression("event.missing", ctx)).toBeUndefined();
    });
  });

  describe("comparison operators", () => {
    it("evaluates >= correctly", () => {
      expect(evaluateExpression("5 >= 5", {})).toBe(true);
      expect(evaluateExpression("4 >= 5", {})).toBe(false);
    });

    it("evaluates <= correctly", () => {
      expect(evaluateExpression("5 <= 5", {})).toBe(true);
      expect(evaluateExpression("6 <= 5", {})).toBe(false);
    });

    it("evaluates != correctly", () => {
      expect(evaluateExpression("5 != 6", {})).toBe(true);
      expect(evaluateExpression("5 != 5", {})).toBe(false);
    });
  });

  describe("logical operators short-circuit", () => {
    it("OR short-circuits on true", () => {
      expect(evaluateExpression("true || false", {})).toBe(true);
      expect(evaluateExpression("false || true", {})).toBe(true);
    });

    it("AND short-circuits on false", () => {
      expect(evaluateExpression("true && false", {})).toBe(false);
      expect(evaluateExpression("false && true", {})).toBe(false);
    });

    it("chained AND", () => {
      expect(evaluateExpression("true && true && true", {})).toBe(true);
      expect(evaluateExpression("true && true && false", {})).toBe(false);
    });

    it("chained OR", () => {
      expect(evaluateExpression("false || false || true", {})).toBe(true);
    });
  });

  describe("parenthesized expressions", () => {
    it("overrides operator precedence", () => {
      expect(evaluateExpression("(1 + 2) * 3", {})).toBe(9);
    });

    it("nested parentheses", () => {
      expect(evaluateExpression("((2 + 3) * (4 - 1))", {})).toBe(15);
    });
  });

  describe("evaluateGuard", () => {
    it("returns boolean true for truthy expression", () => {
      const result = evaluateGuard("context.x > 0", { x: 5 });
      expect(result).toBe(true);
    });

    it("returns boolean false for falsy expression", () => {
      const result = evaluateGuard("context.x > 0", { x: -1 });
      expect(result).toBe(false);
    });

    it("coerces non-boolean truthy value to true", () => {
      const result = evaluateGuard("context.name", { name: "Alice" });
      expect(result).toBe(true);
    });

    it("coerces non-boolean falsy value to false", () => {
      const result = evaluateGuard("context.count", { count: 0 });
      expect(result).toBe(false);
    });
  });

  describe("consume error", () => {
    it("throws when expected token not found", () => {
      // A mismatched parenthesis should cause consume to throw
      expect(() => evaluateExpression("(1 + 2", {})).toThrow("Guard parse error");
    });
  });
});
