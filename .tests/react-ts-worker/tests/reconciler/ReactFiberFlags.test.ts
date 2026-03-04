import { describe, expect, it } from "vitest";
import {
  BeforeMutationMask,
  Callback,
  ChildDeletion,
  ContentReset,
  DidCapture,
  ForceClientRender,
  HostEffectMask,
  Hydrating,
  Incomplete,
  LayoutMask,
  LayoutStatic,
  LifecycleEffectMask,
  MutationMask,
  NoFlags,
  Passive,
  PassiveMask,
  PassiveStatic,
  PerformedWork,
  Placement,
  Ref,
  RefStatic,
  ShouldCapture,
  Snapshot,
  StaticMask,
  StoreConsistency,
  Update,
  Visibility,
} from "../../../../src/react-ts-worker/reconciler/ReactFiberFlags.js";

describe("ReactFiberFlags", () => {
  it("NoFlags is 0", () => {
    expect(NoFlags).toBe(0);
  });

  it("each flag is a power of two (unique bit)", () => {
    const flags = [
      PerformedWork,
      Placement,
      Update,
      ChildDeletion,
      ContentReset,
      Callback,
      DidCapture,
      ForceClientRender,
      Ref,
      Snapshot,
      Passive,
      Hydrating,
      Visibility,
      StoreConsistency,
    ];
    for (const flag of flags) {
      expect(flag > 0).toBe(true);
      // Check that it's a power of 2 (single bit)
      expect((flag & (flag - 1))).toBe(0);
    }
  });

  it("flags do not overlap with each other", () => {
    const flags = [
      Placement,
      Update,
      ChildDeletion,
      ContentReset,
      Callback,
      DidCapture,
      ForceClientRender,
      Ref,
      Snapshot,
      Passive,
      Hydrating,
      Visibility,
      StoreConsistency,
    ];
    for (let i = 0; i < flags.length; i++) {
      for (let j = i + 1; j < flags.length; j++) {
        expect(flags[i]! & flags[j]!).toBe(0);
      }
    }
  });

  describe("composite masks", () => {
    it("LifecycleEffectMask contains expected flags", () => {
      expect((LifecycleEffectMask & Passive) !== 0).toBe(true);
      expect((LifecycleEffectMask & Update) !== 0).toBe(true);
      expect((LifecycleEffectMask & Callback) !== 0).toBe(true);
      expect((LifecycleEffectMask & Ref) !== 0).toBe(true);
      expect((LifecycleEffectMask & Snapshot) !== 0).toBe(true);
      expect((LifecycleEffectMask & StoreConsistency) !== 0).toBe(true);
    });

    it("MutationMask contains expected flags", () => {
      expect((MutationMask & Placement) !== 0).toBe(true);
      expect((MutationMask & Update) !== 0).toBe(true);
      expect((MutationMask & ChildDeletion) !== 0).toBe(true);
      expect((MutationMask & ContentReset) !== 0).toBe(true);
      expect((MutationMask & Ref) !== 0).toBe(true);
      expect((MutationMask & Hydrating) !== 0).toBe(true);
      expect((MutationMask & Visibility) !== 0).toBe(true);
    });

    it("LayoutMask contains Update, Callback, Ref, Visibility", () => {
      expect((LayoutMask & Update) !== 0).toBe(true);
      expect((LayoutMask & Callback) !== 0).toBe(true);
      expect((LayoutMask & Ref) !== 0).toBe(true);
      expect((LayoutMask & Visibility) !== 0).toBe(true);
    });

    it("PassiveMask contains Passive, Visibility, ChildDeletion", () => {
      expect((PassiveMask & Passive) !== 0).toBe(true);
      expect((PassiveMask & Visibility) !== 0).toBe(true);
      expect((PassiveMask & ChildDeletion) !== 0).toBe(true);
    });

    it("BeforeMutationMask contains Snapshot", () => {
      expect((BeforeMutationMask & Snapshot) !== 0).toBe(true);
    });

    it("StaticMask contains LayoutStatic and PassiveStatic", () => {
      expect((StaticMask & LayoutStatic) !== 0).toBe(true);
      expect((StaticMask & PassiveStatic) !== 0).toBe(true);
    });

    it("RefStatic equals LayoutStatic", () => {
      expect(RefStatic).toBe(LayoutStatic);
    });

    it("HostEffectMask covers all host-related flags", () => {
      expect(HostEffectMask).toBeGreaterThan(0);
    });

    it("Incomplete and ShouldCapture are defined", () => {
      expect(Incomplete).toBeGreaterThan(0);
      expect(ShouldCapture).toBeGreaterThan(0);
    });
  });

  describe("flag combinations", () => {
    it("can combine flags with bitwise OR", () => {
      const combined = Placement | Update | ChildDeletion;
      expect((combined & Placement) !== 0).toBe(true);
      expect((combined & Update) !== 0).toBe(true);
      expect((combined & ChildDeletion) !== 0).toBe(true);
    });

    it("can remove flags with bitwise AND and NOT", () => {
      const combined = Placement | Update;
      const withoutPlacement = combined & ~Placement;
      expect((withoutPlacement & Placement)).toBe(0);
      expect((withoutPlacement & Update) !== 0).toBe(true);
    });
  });
});
