import { describe, expect, it } from "vitest";
import { getPersonaId } from "../../onboarding/wizard.js";

describe("onboarding wizard", () => {
  describe("getPersonaId", () => {
    it("returns 0 for all false answers", () => {
      expect(getPersonaId([false, false, false, false])).toBe(0);
    });

    it("returns 15 for all true answers", () => {
      expect(getPersonaId([true, true, true, true])).toBe(15);
    });

    it("returns 8 for [true, false, false, false] (coder only)", () => {
      expect(getPersonaId([true, false, false, false])).toBe(8);
    });

    it("returns 4 for [false, true, false, false] (business only)", () => {
      expect(getPersonaId([false, true, false, false])).toBe(4);
    });

    it("returns 2 for [false, false, true, false] (team only)", () => {
      expect(getPersonaId([false, false, true, false])).toBe(2);
    });

    it("returns 1 for [false, false, false, true] (AI only)", () => {
      expect(getPersonaId([false, false, false, true])).toBe(1);
    });

    it("returns 12 for [true, true, false, false]", () => {
      expect(getPersonaId([true, true, false, false])).toBe(12);
    });

    it("returns 7 for [false, true, true, true]", () => {
      expect(getPersonaId([false, true, true, true])).toBe(7);
    });
  });

  describe("all 16 persona combinations", () => {
    // Import PERSONAS indirectly by testing all 16 getPersonaId values
    const allCombinations: boolean[][] = [];
    for (let i = 0; i < 16; i++) {
      allCombinations.push([!!(i & 8), !!(i & 4), !!(i & 2), !!(i & 1)]);
    }

    it("produces unique ids 0-15 for all answer combinations", () => {
      const ids = allCombinations.map(getPersonaId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(16);
      for (let i = 0; i < 16; i++) {
        expect(uniqueIds.has(i)).toBe(true);
      }
    });
  });
});
