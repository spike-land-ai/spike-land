import { describe, expect, it } from "vitest";
import { evaluateExpression, evaluateGuard } from "../../src/state-machine/parser.js";

describe("Guard Expression Parser Coverage", () => {
  const context = {
    a: 1,
    b: 2,
    c: 0,
    nested: { x: { y: 10 } },
    _event: { data: "hi" }
  };

  describe("Operators and Branches", () => {
    it("should cover all comparison operators and outcomes", () => {
      expect(evaluateExpression("1 >= 1", context)).toBe(true);
      expect(evaluateExpression("1 >= 0", context)).toBe(true);
      expect(evaluateExpression("0 >= 1", context)).toBe(false);
      expect(evaluateExpression("1 <= 1", context)).toBe(true);
      expect(evaluateExpression("0 <= 1", context)).toBe(true);
      expect(evaluateExpression("1 <= 0", context)).toBe(false);
      expect(evaluateExpression("2 != 1", context)).toBe(true);
      expect(evaluateExpression("1 != 1", context)).toBe(false);
      expect(evaluateExpression("2 > 1", context)).toBe(true);
      expect(evaluateExpression("1 > 2", context)).toBe(false);
      expect(evaluateExpression("1 < 2", context)).toBe(true);
      expect(evaluateExpression("2 < 1", context)).toBe(false);
    });

    it("should cover logical operators branches", () => {
      expect(evaluateExpression("true || false", context)).toBe(true);
      expect(evaluateExpression("false || true", context)).toBe(true);
      expect(evaluateExpression("true && true", context)).toBe(true);
      expect(evaluateExpression("true && false", context)).toBe(false);
      expect(evaluateExpression("!true", context)).toBe(false);
      expect(evaluateExpression("!false", context)).toBe(true);
    });

    it("should cover event access", () => {
      expect(evaluateExpression("event.data", context)).toBe("hi");
      expect(evaluateExpression("event.missing", context)).toBeUndefined();
      
      const deepContext = { _event: { outer: { inner: 'deep' } } };
      expect(evaluateExpression("event.outer.inner", deepContext)).toBe('deep');
    });

    it("should cover power operator", () => {
      expect(evaluateExpression("2 ** 3", context)).toBe(8);
      expect(evaluateExpression("2 ** 3 ** 2", context)).toBe(Math.pow(8, 2)); // Left-associative in this parser
    });

    it("should cover evaluateGuard", () => {
      expect(evaluateGuard("1 == 1", context)).toBe(true);
      expect(evaluateGuard("1 == 0", context)).toBe(false);
    });

    it("should cover division by zero", () => {
      expect(() => evaluateExpression("10 / 0", context)).toThrow("Division by zero");
    });

    it("should cover multiplication", () => {
      expect(evaluateExpression("2 * 3", context)).toBe(6);
    });

    it("should cover subtraction", () => {
      expect(evaluateExpression("10 - 3", context)).toBe(7);
    });

    it("should handle null keyword", () => {
      expect(evaluateExpression("null", context)).toBe(null);
      expect(evaluateExpression("context.missing == null", context)).toBe(false); // undefined === null is false
      expect(evaluateExpression("null == null", context)).toBe(true);
    });

    it("should handle negative numbers", () => {
      expect(evaluateExpression("-5 + 10", context)).toBe(5);
      expect(evaluateExpression("-5.5", context)).toBe(-5.5);
    });
  });

  describe("String Literals and Escapes", () => {
    it("should handle escaped quotes in strings", () => {
      expect(evaluateExpression("'it\\'s fine'", context)).toBe("it's fine");
      expect(evaluateExpression('"he said \\"hi\\""', context)).toBe('he said "hi"');
    });

    it("should throw on unterminated strings", () => {
      expect(() => evaluateExpression("'broken", context)).toThrow("unterminated string literal");
      expect(() => evaluateExpression('"broken', context)).toThrow("unterminated string literal");
    });

    it("should throw on unterminated escape", () => {
      expect(() => evaluateExpression("'broken\\", context)).toThrow("unterminated string escape");
      expect(() => evaluateExpression('"broken\\', context)).toThrow("unterminated string escape");
    });
  });

  describe("Error Handling", () => {
    it("should throw on unexpected character in primary", () => {
      expect(() => evaluateExpression("?", context)).toThrow("unexpected character");
      expect(() => evaluateExpression("", context)).toThrow('unexpected character "EOF"');
    });

    it("should throw on unknown identifiers", () => {
      expect(() => evaluateExpression("somethingElse", context)).toThrow('unknown identifier "somethingElse"');
    });

    it("should handle trailing whitespace in evaluateExpression", () => {
      expect(evaluateExpression("  1  ", context)).toBe(1);
    });

    it("should throw on unexpected trailing content", () => {
      expect(() => evaluateExpression("1 + 1 extra", context)).toThrow("unexpected trailing content");
    });

    it("should handle resolvePath with non-objects", () => {
      expect(evaluateExpression("context.a.b", context)).toBeUndefined();
      expect(evaluateExpression("context.nested.missing.deep", context)).toBeUndefined();
    });

    it("should handle division", () => {
      expect(evaluateExpression("10 / 2", context)).toBe(5);
    });

    it("should throw on division by zero", () => {
      expect(() => evaluateExpression("10 / 0", context)).toThrow("Division by zero");
    });
    
    it("should throw on invalid number format", () => {
      // Numbers are parsed by Number(), so we need to find something that /\d/ starts but Number() fails
      // Actually Number('1.2.3') is NaN.
      // The while loop matches /[\d.]/
      expect(() => evaluateExpression("1.2.3", context)).toThrow('invalid number "1.2.3"');
    });
  });

  describe("Consume and Peek", () => {
    it("should throw in consume if token mismatch", () => {
      // We can trigger this by forcing a failure in a rule that calls consume
      // e.g. parsePrimary calls consume(p, ")") if it sees "("
      expect(() => evaluateExpression("(1 + 1", context)).toThrow('expected ")", found ""');
    });
  });
});
