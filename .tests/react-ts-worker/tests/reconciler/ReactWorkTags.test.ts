import { describe, expect, it } from "vitest";
import {
  ClassComponent,
  ContextConsumer,
  ContextProvider,
  ForwardRef,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostPortal,
  HostRoot,
  HostText,
  LazyComponent,
  MemoComponent,
  Mode,
  Profiler,
  SimpleMemoComponent,
  SuspenseComponent,
} from "../../../../src/react-ts-worker/reconciler/ReactWorkTags.js";

describe("ReactWorkTags", () => {
  it("FunctionComponent is 0", () => {
    expect(FunctionComponent).toBe(0);
  });

  it("ClassComponent is 1", () => {
    expect(ClassComponent).toBe(1);
  });

  it("HostRoot is 3", () => {
    expect(HostRoot).toBe(3);
  });

  it("HostPortal is 4", () => {
    expect(HostPortal).toBe(4);
  });

  it("HostComponent is 5", () => {
    expect(HostComponent).toBe(5);
  });

  it("HostText is 6", () => {
    expect(HostText).toBe(6);
  });

  it("Fragment is 7", () => {
    expect(Fragment).toBe(7);
  });

  it("Mode is 8", () => {
    expect(Mode).toBe(8);
  });

  it("ContextConsumer is 9", () => {
    expect(ContextConsumer).toBe(9);
  });

  it("ContextProvider is 10", () => {
    expect(ContextProvider).toBe(10);
  });

  it("ForwardRef is 11", () => {
    expect(ForwardRef).toBe(11);
  });

  it("Profiler is 12", () => {
    expect(Profiler).toBe(12);
  });

  it("SuspenseComponent is 13", () => {
    expect(SuspenseComponent).toBe(13);
  });

  it("MemoComponent is 14", () => {
    expect(MemoComponent).toBe(14);
  });

  it("SimpleMemoComponent is 15", () => {
    expect(SimpleMemoComponent).toBe(15);
  });

  it("LazyComponent is 16", () => {
    expect(LazyComponent).toBe(16);
  });

  it("all tags are unique", () => {
    const tags = [
      FunctionComponent,
      ClassComponent,
      HostRoot,
      HostPortal,
      HostComponent,
      HostText,
      Fragment,
      Mode,
      ContextConsumer,
      ContextProvider,
      ForwardRef,
      Profiler,
      SuspenseComponent,
      MemoComponent,
      SimpleMemoComponent,
      LazyComponent,
    ];
    const unique = new Set(tags);
    expect(unique.size).toBe(tags.length);
  });
});
