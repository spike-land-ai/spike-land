import { describe, expect, it } from "vitest";
import { memo } from "../../react/ReactMemo.js";
import { REACT_MEMO_TYPE } from "../../react/ReactSymbols.js";

describe("memo", () => {
  it("creates memo component with correct $$typeof", () => {
    const Comp = () => null;
    const MemoComp = memo(Comp);
    expect(MemoComp.$$typeof).toBe(REACT_MEMO_TYPE);
  });

  it("stores the wrapped component as type", () => {
    const Comp = () => null;
    const MemoComp = memo(Comp);
    expect(MemoComp.type).toBe(Comp);
  });

  it("defaults compare to null when not provided", () => {
    const Comp = () => null;
    const MemoComp = memo(Comp);
    expect(MemoComp.compare).toBeNull();
  });

  it("stores custom compare function", () => {
    const Comp = () => null;
    const compare = (prev: Record<string, unknown>, next: Record<string, unknown>) =>
      prev.id === next.id;
    const MemoComp = memo(Comp, compare);
    expect(MemoComp.compare).toBe(compare);
  });

  it("null compare argument results in null compare", () => {
    const Comp = () => null;
    const MemoComp = memo(Comp, null);
    expect(MemoComp.compare).toBeNull();
  });

  it("works with typed props", () => {
    interface ButtonProps {
      label: string;
      onClick: () => void;
    }
    const Button = (_props: ButtonProps) => null;
    const MemoButton = memo(Button);
    expect(MemoButton.type).toBe(Button);
    expect(MemoButton.$$typeof).toBe(REACT_MEMO_TYPE);
  });

  it("each call wraps independently", () => {
    const Comp = () => null;
    const Memo1 = memo(Comp);
    const Memo2 = memo(Comp);
    expect(Memo1).not.toBe(Memo2);
    expect(Memo1.type).toBe(Memo2.type);
  });
});
