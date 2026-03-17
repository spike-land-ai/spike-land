import { describe, expect, it } from "vitest";
import {
  peek,
  pop,
  push,
} from "../../../../src/core/react-engine/core-logic/scheduler/SchedulerMinHeap.js";
import type { HeapNode } from "../../../../src/core/react-engine/core-logic/scheduler/SchedulerMinHeap.js";

describe("SchedulerMinHeap", () => {
  function makeNode(id: number, sortIndex: number): HeapNode {
    return { id, sortIndex };
  }

  it("peek returns null on empty heap", () => {
    const heap: HeapNode[] = [];
    expect(peek(heap)).toBeNull();
  });

  it("pop returns null on empty heap", () => {
    const heap: HeapNode[] = [];
    expect(pop(heap)).toBeNull();
  });

  it("maintains min-heap property with push/pop", () => {
    const heap: HeapNode[] = [];
    push(heap, makeNode(3, 30));
    push(heap, makeNode(1, 10));
    push(heap, makeNode(2, 20));

    expect(pop(heap)?.id).toBe(1); // lowest sortIndex first
    expect(pop(heap)?.id).toBe(2);
    expect(pop(heap)?.id).toBe(3);
    expect(pop(heap)).toBeNull();
  });

  it("peek does not remove the element", () => {
    const heap: HeapNode[] = [];
    push(heap, makeNode(1, 10));
    expect(peek(heap)?.id).toBe(1);
    expect(peek(heap)?.id).toBe(1); // still there
    expect(heap).toHaveLength(1);
  });
});
