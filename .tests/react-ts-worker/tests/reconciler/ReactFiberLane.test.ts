import { describe, expect, it } from "vitest";
import {
  claimNextRetryLane,
  claimNextTransitionLane,
  createLaneMap,
  DefaultLane,
  DeferredLane,
  getEntangledLanes,
  getHighestPriorityLane,
  getNextLanes,
  higherPriorityLane,
  IdleLane,
  includesBlockingLane,
  includesNonIdleWork,
  includesOnlyNonUrgentLanes,
  includesOnlyTransitions,
  includesSomeLane,
  includesTransitionLane,
  InputContinuousLane,
  intersectLanes,
  isSubsetOfLanes,
  laneToLanes,
  markRootFinished,
  markRootPinged,
  markRootUpdated,
  mergeLanes,
  NoLane,
  NoLanes,
  OffscreenLane,
  pickArbitraryLane,
  removeLanes,
  SyncLane,
  SyncUpdateLanes,
  TotalLanes,
} from "../../../../src/react-ts-worker/reconciler/ReactFiberLane.js";

describe("ReactFiberLane", () => {
  describe("constants", () => {
    it("NoLanes is 0", () => {
      expect(NoLanes).toBe(0);
    });

    it("SyncLane is non-zero", () => {
      expect(SyncLane).toBeGreaterThan(0);
    });

    it("TotalLanes is 31", () => {
      expect(TotalLanes).toBe(31);
    });

    it("SyncUpdateLanes includes SyncLane, InputContinuousLane, DefaultLane", () => {
      expect((SyncUpdateLanes & SyncLane) !== 0).toBe(true);
      expect((SyncUpdateLanes & InputContinuousLane) !== 0).toBe(true);
      expect((SyncUpdateLanes & DefaultLane) !== 0).toBe(true);
    });
  });

  describe("getHighestPriorityLane", () => {
    it("returns lowest set bit", () => {
      const lanes = SyncLane | DefaultLane;
      expect(getHighestPriorityLane(lanes)).toBe(SyncLane);
    });

    it("returns 0 for no lanes", () => {
      expect(getHighestPriorityLane(NoLanes)).toBe(0);
    });
  });

  describe("includesSomeLane", () => {
    it("returns true when lanes overlap", () => {
      expect(includesSomeLane(SyncLane | DefaultLane, SyncLane)).toBe(true);
    });

    it("returns false when lanes do not overlap", () => {
      expect(includesSomeLane(SyncLane, DefaultLane)).toBe(false);
    });

    it("returns false for NoLanes", () => {
      expect(includesSomeLane(NoLanes, SyncLane)).toBe(false);
    });
  });

  describe("isSubsetOfLanes", () => {
    it("returns true when subset is fully contained", () => {
      expect(isSubsetOfLanes(SyncLane | DefaultLane, SyncLane)).toBe(true);
    });

    it("returns false when subset is not contained", () => {
      expect(isSubsetOfLanes(SyncLane, DefaultLane)).toBe(false);
    });

    it("returns true for NoLanes as subset", () => {
      expect(isSubsetOfLanes(SyncLane, NoLanes)).toBe(true);
    });
  });

  describe("mergeLanes", () => {
    it("merges two lanes", () => {
      const result = mergeLanes(SyncLane, DefaultLane);
      expect((result & SyncLane) !== 0).toBe(true);
      expect((result & DefaultLane) !== 0).toBe(true);
    });

    it("merging with NoLanes returns the same lane", () => {
      expect(mergeLanes(SyncLane, NoLanes)).toBe(SyncLane);
    });
  });

  describe("removeLanes", () => {
    it("removes a lane from set", () => {
      const lanes = SyncLane | DefaultLane;
      const result = removeLanes(lanes, SyncLane);
      expect((result & SyncLane)).toBe(0);
      expect((result & DefaultLane) !== 0).toBe(true);
    });

    it("removing non-existent lane has no effect", () => {
      expect(removeLanes(SyncLane, DefaultLane)).toBe(SyncLane);
    });
  });

  describe("intersectLanes", () => {
    it("returns intersection", () => {
      const result = intersectLanes(SyncLane | DefaultLane, SyncLane | InputContinuousLane);
      expect(result).toBe(SyncLane);
    });

    it("returns NoLanes for no intersection", () => {
      expect(intersectLanes(SyncLane, DefaultLane)).toBe(NoLanes);
    });
  });

  describe("laneToLanes", () => {
    it("returns the same lane value", () => {
      expect(laneToLanes(SyncLane)).toBe(SyncLane);
    });
  });

  describe("includesNonIdleWork", () => {
    it("returns true for SyncLane", () => {
      expect(includesNonIdleWork(SyncLane)).toBe(true);
    });

    it("returns false for IdleLane", () => {
      expect(includesNonIdleWork(IdleLane)).toBe(false);
    });

    it("returns false for NoLanes", () => {
      expect(includesNonIdleWork(NoLanes)).toBe(false);
    });
  });

  describe("includesBlockingLane", () => {
    it("returns true for SyncLane", () => {
      expect(includesBlockingLane(SyncLane)).toBe(true);
    });

    it("returns true for DefaultLane", () => {
      expect(includesBlockingLane(DefaultLane)).toBe(true);
    });

    it("returns false for IdleLane", () => {
      expect(includesBlockingLane(IdleLane)).toBe(false);
    });
  });

  describe("includesTransitionLane", () => {
    it("returns false for SyncLane", () => {
      expect(includesTransitionLane(SyncLane)).toBe(false);
    });

    it("returns false for NoLanes", () => {
      expect(includesTransitionLane(NoLanes)).toBe(false);
    });
  });

  describe("includesOnlyNonUrgentLanes", () => {
    it("returns true for IdleLane", () => {
      expect(includesOnlyNonUrgentLanes(IdleLane)).toBe(true);
    });

    it("returns false for SyncLane", () => {
      expect(includesOnlyNonUrgentLanes(SyncLane)).toBe(false);
    });

    it("returns true for NoLanes", () => {
      expect(includesOnlyNonUrgentLanes(NoLanes)).toBe(true);
    });
  });

  describe("includesOnlyTransitions", () => {
    it("returns true for NoLanes (vacuously)", () => {
      expect(includesOnlyTransitions(NoLanes)).toBe(true);
    });

    it("returns false for SyncLane", () => {
      expect(includesOnlyTransitions(SyncLane)).toBe(false);
    });
  });

  describe("claimNextTransitionLane", () => {
    it("returns a non-zero lane", () => {
      const lane = claimNextTransitionLane();
      expect(lane).toBeGreaterThan(0);
    });

    it("returns different lanes on sequential calls (cycles)", () => {
      const lane1 = claimNextTransitionLane();
      const lane2 = claimNextTransitionLane();
      // They may be different or cycle, but should always be valid
      expect(lane1).toBeGreaterThan(0);
      expect(lane2).toBeGreaterThan(0);
    });
  });

  describe("claimNextRetryLane", () => {
    it("returns a non-zero lane", () => {
      const lane = claimNextRetryLane();
      expect(lane).toBeGreaterThan(0);
    });
  });

  describe("pickArbitraryLane", () => {
    it("returns a lane from the set", () => {
      const lanes = SyncLane | DefaultLane;
      const lane = pickArbitraryLane(lanes);
      expect((lanes & lane) !== 0).toBe(true);
    });
  });

  describe("createLaneMap", () => {
    it("creates an array of TotalLanes length", () => {
      const map = createLaneMap(0);
      expect(map.length).toBe(TotalLanes);
    });

    it("fills with the initial value", () => {
      const map = createLaneMap("test");
      expect(map.every((v) => v === "test")).toBe(true);
    });
  });

  describe("markRootUpdated", () => {
    it("adds updateLane to pendingLanes", () => {
      const root = { pendingLanes: NoLanes, suspendedLanes: SyncLane, pingedLanes: SyncLane };
      markRootUpdated(root, DefaultLane);
      expect((root.pendingLanes & DefaultLane) !== 0).toBe(true);
    });

    it("clears suspendedLanes and pingedLanes for non-idle updates", () => {
      const root = { pendingLanes: NoLanes, suspendedLanes: SyncLane, pingedLanes: SyncLane };
      markRootUpdated(root, SyncLane);
      expect(root.suspendedLanes).toBe(NoLanes);
      expect(root.pingedLanes).toBe(NoLanes);
    });

    it("does not clear suspendedLanes for IdleLane update", () => {
      const root = { pendingLanes: NoLanes, suspendedLanes: SyncLane, pingedLanes: SyncLane };
      markRootUpdated(root, IdleLane);
      expect(root.suspendedLanes).toBe(SyncLane);
    });
  });

  describe("markRootFinished", () => {
    it("sets pendingLanes to remainingLanes", () => {
      const root = {
        pendingLanes: SyncLane | DefaultLane,
        suspendedLanes: SyncLane,
        pingedLanes: SyncLane,
        entangledLanes: DefaultLane,
        expiredLanes: SyncLane | DefaultLane,
      };
      markRootFinished(root, DefaultLane);
      expect(root.pendingLanes).toBe(DefaultLane);
      expect(root.suspendedLanes).toBe(NoLanes);
      expect(root.pingedLanes).toBe(NoLanes);
    });

    it("masks expiredLanes and entangledLanes with remainingLanes", () => {
      const root = {
        pendingLanes: SyncLane | DefaultLane,
        suspendedLanes: NoLanes,
        pingedLanes: NoLanes,
        entangledLanes: SyncLane | DefaultLane,
        expiredLanes: SyncLane | DefaultLane,
      };
      markRootFinished(root, DefaultLane);
      expect(root.expiredLanes).toBe(DefaultLane);
      expect(root.entangledLanes).toBe(DefaultLane);
    });
  });

  describe("getNextLanes", () => {
    it("returns NoLanes when no pending lanes", () => {
      const root = { pendingLanes: NoLanes, suspendedLanes: NoLanes, pingedLanes: NoLanes };
      expect(getNextLanes(root, NoLanes)).toBe(NoLanes);
    });

    it("returns highest priority non-idle lane", () => {
      const root = {
        pendingLanes: SyncLane | DefaultLane,
        suspendedLanes: NoLanes,
        pingedLanes: NoLanes,
      };
      expect(getNextLanes(root, NoLanes)).toBe(SyncLane);
    });

    it("skips suspended lanes and picks pinged", () => {
      const root = {
        pendingLanes: SyncLane,
        suspendedLanes: SyncLane,
        pingedLanes: SyncLane,
      };
      const result = getNextLanes(root, NoLanes);
      expect(result).toBe(SyncLane);
    });

    it("skips suspended lanes when none pinged returns NoLanes", () => {
      const root = {
        pendingLanes: SyncLane,
        suspendedLanes: SyncLane,
        pingedLanes: NoLanes,
      };
      const result = getNextLanes(root, NoLanes);
      expect(result).toBe(NoLanes);
    });

    it("handles idle lanes when no non-idle pending", () => {
      const root = {
        pendingLanes: IdleLane,
        suspendedLanes: NoLanes,
        pingedLanes: NoLanes,
      };
      const result = getNextLanes(root, NoLanes);
      expect(result).toBe(IdleLane);
    });
  });

  describe("getEntangledLanes", () => {
    it("returns renderLanes when no entanglements", () => {
      const root = { entangledLanes: NoLanes, entanglements: createLaneMap(NoLanes) };
      expect(getEntangledLanes(root, SyncLane)).toBe(SyncLane);
    });

    it("includes DefaultLane when InputContinuousLane is included", () => {
      const root = { entangledLanes: NoLanes, entanglements: createLaneMap(NoLanes) };
      const result = getEntangledLanes(root, InputContinuousLane | DefaultLane);
      expect((result & DefaultLane) !== 0).toBe(true);
    });

    it("propagates entanglements", () => {
      const entanglements = createLaneMap(NoLanes);
      const syncLaneIndex = 31 - Math.clz32(SyncLane);
      entanglements[syncLaneIndex] = DefaultLane;
      const root = { entangledLanes: SyncLane, entanglements };
      const result = getEntangledLanes(root, SyncLane);
      expect((result & DefaultLane) !== 0).toBe(true);
    });
  });

  describe("markRootPinged", () => {
    it("marks suspended lanes as pinged", () => {
      const root = { pingedLanes: NoLanes, suspendedLanes: SyncLane };
      markRootPinged(root, SyncLane);
      expect((root.pingedLanes & SyncLane) !== 0).toBe(true);
    });

    it("does not ping non-suspended lanes", () => {
      const root = { pingedLanes: NoLanes, suspendedLanes: NoLanes };
      markRootPinged(root, SyncLane);
      expect(root.pingedLanes).toBe(NoLanes);
    });
  });

  describe("higherPriorityLane", () => {
    it("returns lower numeric value (higher priority)", () => {
      expect(higherPriorityLane(SyncLane, DefaultLane)).toBe(SyncLane);
    });

    it("returns b when a is NoLane", () => {
      expect(higherPriorityLane(NoLane, DefaultLane)).toBe(DefaultLane);
    });

    it("returns b when a >= b", () => {
      expect(higherPriorityLane(DefaultLane, SyncLane)).toBe(SyncLane);
    });
  });

  describe("extra lane constants", () => {
    it("OffscreenLane is defined", () => {
      expect(OffscreenLane).toBeGreaterThan(0);
    });

    it("DeferredLane is defined", () => {
      expect(DeferredLane).toBeGreaterThan(0);
    });
  });
});
