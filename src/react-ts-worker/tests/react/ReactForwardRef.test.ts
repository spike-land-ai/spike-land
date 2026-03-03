import { describe, it, expect } from "vitest";
import { forwardRef } from "../../react/ReactForwardRef.js";
import { REACT_FORWARD_REF_TYPE } from "../../react/ReactSymbols.js";
import type { Ref } from "../../react/ReactTypes.js";

describe("forwardRef", () => {
  it("creates forwardRef component with correct $$typeof", () => {
    const render = (_props: Record<string, unknown>, _ref: Ref<HTMLDivElement>) => null;
    const ForwardComp = forwardRef(render);
    expect(ForwardComp.$$typeof).toBe(REACT_FORWARD_REF_TYPE);
  });

  it("stores render function", () => {
    const render = (_props: Record<string, unknown>, _ref: Ref<HTMLDivElement>) => null;
    const ForwardComp = forwardRef(render);
    expect(ForwardComp.render).toBe(render);
  });

  it("render function can be called with props and ref", () => {
    const mockRef = { current: null };
    const render = (props: { id: string }, _ref: Ref<HTMLDivElement>) => {
      return { id: props.id };
    };
    const ForwardComp = forwardRef(render);
    // The render function should be callable
    const result = ForwardComp.render({ id: "test" }, mockRef) as { id: string };
    expect(result.id).toBe("test");
  });

  it("each call creates independent component", () => {
    const render = () => null;
    const Comp1 = forwardRef(render);
    const Comp2 = forwardRef(render);
    expect(Comp1).not.toBe(Comp2);
    expect(Comp1.render).toBe(Comp2.render);
  });

  it("works with typed props and ref", () => {
    interface InputProps { placeholder: string }
    const render = (props: InputProps, _ref: Ref<HTMLInputElement>) => {
      return props.placeholder;
    };
    const ForwardInput = forwardRef<InputProps, HTMLInputElement>(render);
    expect(ForwardInput.$$typeof).toBe(REACT_FORWARD_REF_TYPE);
    expect(ForwardInput.render).toBe(render);
  });
});
